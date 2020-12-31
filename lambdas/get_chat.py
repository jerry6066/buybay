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
    if 'Item' in response:
        response = response['Item']
        return response

def put_item(table_name, item):
    table = dynamodb.Table(table_name)
    try:
        response = table.put_item(Item = item)
    except ClientError as e:
        print(e.response['Error']['Message'])
        raise
    
#########################################################

def lambda_handler(event, context):
    # TODO implement
    print(event)
    chat_id = event['path'].split("/chats/")[1]
    body = json.loads(event['body'])
    user_id = body['user_id']
    
    # chat_id = ''
    # user_id = ''
    
    user_name = get_item("ProfilesDB", {'user_id': user_id})['user_name']
    chat_id, serial_num = chat_id.split('/')
    
    chat = get_item("ChatDB", {'chat_id': chat_id})
    if chat == None:
        return {
            'statusCode': 200,
            'body': json.dumps('chat not found')
        }
    if user_id not in [chat['user_id1'], chat['user_id2']]:
        return {
            'statusCode': 200,
            'body': json.dumps('not a user in the chat')
        }
        
    to_user_name = [chat['user_name1'], chat['user_name2']]
    print(to_user_name)
    print(user_name)
    to_user_name.remove(user_name)
    to_user_name = to_user_name[0]
    
    response = {
        'status': True,
        'to_user': to_user_name,
        'chats': chat['chats'][int(serial_num):]
    }
    print(response)
    
    return {
        'statusCode': 200,
        'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
            },
        'body': json.dumps(response)
    }
