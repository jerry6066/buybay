import boto3
import json
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
    
#####################################################

def lambda_handler(event, context):
    # TODO implement
    print(event)
    chat_id = event['path'].split("/chats/")[1]
    body = json.loads(event['body'])
    user_id = body['user_id']
    content = body['content']
    
    # user_id = ''
    # content = 'Hello!'
    # chat_id = ''
    
    # chat_id, serial_num = chat_id.split('/')
    user_name = get_item("ProfilesDB", {'user_id': user_id})['user_name']
    
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
    
    chat['last_content'] = content
    if chat['chats'] == []:
        serial_num = str(1)
    else:
        serial_num = str( int(chat['chats'][-1]['id']) + 1)
    chat['chats'].append({
        'id': serial_num,
        'time': str(datetime.datetime.now() - datetime.timedelta(hours=5)).split(".")[0],
        'sender': user_name,
        'content': content
    })
    print(chat)
    put_item("ChatDB", chat)
    
    response = {
        'status': True
    }
    return {
        'statusCode': 200,
        'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
            },
        'body': json.dumps(response)
    }
