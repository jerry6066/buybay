import boto3
import json
import uuid
import datetime
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

################################################
#  main

def lambda_handler(event, context):
    # TODO implement
    
    # parse event
    # print(event)
    body = event
    item_id = body['item_id']
    user_id = body['user_id']
    content = body['content']
    # item_id = ""
    # user_id = ""
    # content = "This is a test comment."
    
    # append new message to  & update item DB
    user_name = get_item("ProfilesDB", {"user_id": user_id})['Item']['user_name']
    
    msg_id = str(uuid.uuid4())
    new_msg = {
        "msg_id": msg_id,
        "item_id": item_id,
        "user_id": user_id,
        "user_name": user_name,
        "content": content,
        "timestamp": str(datetime.datetime.now() - datetime.timedelta(hours=5)).split(".")[0]
        }
    
    put_item("MessagesDB", new_msg)
    
    item = get_item("ItemsDB", {"item_id": item_id})['Item']
    item['messages'].append(msg_id)
    put_item("ItemsDB", item)
    
    
    # generate new item info
    # status_dict = {0: 'in stock', 1: 'out of stock'}
    # message_ids = item['messages']
    # messages = []
    # for msg in message_ids:
    #     msg_json = get_item("MessagesDB", {"msg_id": msg})['Item']
    #     message = {
    #         "message_id": msg_json['msg_id'],
    #         "user_id": msg_json['user_id'],
    #         "user_name": msg_json['user_name'],
    #         "post_time": msg_json['timestamp'].split(".")[0],
    #         "content": msg_json['content']
    #     }
    #     messages.append(message)
        
    response = {
            "status": True #,
            # "item":{
            #     "item_id": item_id,
            #     "item_name": item['item_name'],
            #     "user_id": item['user_id'],
            #     "user_name": item['user_name'],
            #     "status": status_dict[item['status']],
            #     "post_time": item['timestamp'].split(" ")[0],
            #     "main_image_url": item['main_img_url'],
            #     "img_urls": item['img_urls'],
            #     "messages": messages,
            #     "num_visits": str(item['num_visits']),
            #     "price": item['price'],
            #     "description": item['description']
            # }
        }
        
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
