import boto3
import json
from boto3.dynamodb.conditions import Key
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
    
    
##############################################
# main

def lambda_handler(event, context):
    # TODO implement
    # parse event
    print(event)
    # user_id = ''
    uid = event['path'].split("/user/")[1]
    visitor_id = json.loads(event['body'])['user_id']
    
    if uid == "0":
        user_id = json.loads(event['body'])['user_id']
    else:
        user_id = get_item("uidDB", {"uid": uid})['Item']['user_id']
    
    user = get_item("ProfilesDB", {"user_id": user_id})['Item']
    print(user)
    user_id = user['user_id']
    user_name = user['user_name']
    
    items = []
    count = 0
    for id in user['user_items']:
        info = get_item("ItemsDB", {"item_id": id})['Item']
        count = count + 1
        item = {
            'item_id': info['item_id'],
            'item_name': info['item_name'],
            'user_id': info['user_id'],
            'user_name': info['user_name'],
            'price': str(info['price']),
            'main_img_url': info['main_img_url'],
            'num_visits': str(info['num_visits']),
            'timestamp': info['timestamp'].split(" ")[0],
            'status': str(info['status'])
        }
        items.append(item)
    
    if user_id != visitor_id:
        user_id = "**** @" + user_id.split("@")[1]
    
    response = {
        "status": True,
        "user_id": user_id,
        "user_name": user_name,
        "uid": user['uid'],
        "num_items": count,
        "item": items
    }
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
