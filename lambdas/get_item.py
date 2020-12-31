import boto3
import json
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb")

def get_item(table_name, key):
    table = dynamodb.Table(table_name)
    try:
        response = table.get_item(Key = key)
    except ClientError as e:
        print(e.response['Error']['Message'])
        raise
    return response

def put_item(table_name, item):
    table = dynamodb.Table(table_name)
    try:
        response = table.put_item(Item = item)
    except ClientError as e:
        print(e.response['Error']['Message'])
        raise

####################################################
#  main

def lambda_handler(event, context):
    # TODO implement
    item_id = event['path'].split("/item/")[1]
    visitor_id = json.loads(event['body'])['user_id']
    # print('received item_id ', item_id)
    
    item = get_item("ItemsDB", {"item_id": item_id})
    
    if 'Item' in item:
        
        item = item['Item']
        item_id = item['item_id']
        item_name = item['item_name']
        user_id = item['user_id']
        user_name = item['user_name']
        uid = get_item("ProfilesDB", {"user_id": user_id})['Item']['uid']
        
        if item['status']:
            status = 'out of stock'
        else:
            status = 'in stock'
        
        post_time = item['timestamp'].split(" ")[0]
        main_image_url = item['main_img_url']
        img_urls = item['img_urls']
        message_ids = item['messages']
        price = item['price']
        description = item['description']
        
        if visitor_id not in item["visited_user"]:
            item["visited_user"].append(visitor_id)
            item["num_visits"] = item["num_visits"] + 1
            put_item("ItemsDB", item)
        
        num_visits = str(item['num_visits'])
        
        messages = []
        for msg in message_ids:
            msg_json = get_item("MessagesDB", {"msg_id": msg})['Item']
            message = {
                "message_id": msg_json['msg_id'],
                "user_id": msg_json['user_id'],
                "user_name": msg_json['user_name'],
                "post_time": msg_json['timestamp'].split(".")[0],
                "content": msg_json['content']
            }
            messages.append(message)
        
        response = {
            "status": True,
            "item":{
                "item_id": item_id,
                "item_name": item_name,
                "user_id": user_id,
                "uid": uid,
                "user_name": user_name,
                "status": status,
                "post_time": post_time,
                "main_image_url": main_image_url,
                "img_urls": img_urls,
                "messages": messages,
                "num_visits": num_visits,
                "price": price,
                "description": description
            }
        }
    
    else:
        print('no item found, id: ', item_id)
        response = {
    "status": False
    }
    
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
