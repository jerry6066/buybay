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
    
#####################################################

def lambda_handler(event, context):
    # TODO implement
    print(event)
    user_id = json.loads(event['body'])['user_id']
    print(user_id)
    # user_id = ''
    
    user = get_item("ProfilesDB", {'user_id': user_id})
    if user == None:
        return {
            'statusCode': 200,
            'body': json.dumps('not a valid user')
        }
        
    chats = []
    for chat_id in user['chat_ids']:
        chat = get_item("ChatDB", {'chat_id': chat_id})
        name = [chat['user_name1'], chat['user_name2']]
        name.remove(user['user_name'])
        chats.append({
            'chat_id': chat_id,
            'name': name[0],
            'last_content': chat['last_content']
        })
    
    response = {
        'status': True,
        'chats': chats
    }
    
    return {
        'statusCode': 200,
        'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
            },
        'body': json.dumps(response)
    }
