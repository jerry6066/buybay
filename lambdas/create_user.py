import boto3
import json
import uuid
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

#################################################

def lambda_handler(event, context):
    # TODO implement
    print(event)
    body = json.loads(event['body'])
    print(body)
    user_id = body["user_id"]
    user_name = body['user_name']
    
    check = get_item("ProfilesDB", {"user_id": user_id})
    if 'Item' in check:
        print("this email is already linked with an account")
        response = {
            "status": False,
            "message": "this email is already linked with an account"
        }
        return {
            'statusCode': 200,
            'body': json.dumps(response)
        }
    
    uid = str(uuid.uuid4())
    
    profile = {
        "user_id": user_id,
        "user_name": user_name,
        "uid": uid,
        "user_items": [],
        "chat_ids": []
    }
    
    idlog = {
        "uid": uid,
        "user_id": user_id
    }
    
    put_item("ProfilesDB", profile)
    put_item("uidDB", idlog)
    
    response = {
        "status": True
    }
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
