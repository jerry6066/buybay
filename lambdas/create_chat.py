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
    body = json.loads(event['body'])
    user_id = body['user_id']
    to_uid = body['to_uid']
    # user_id = ''
    # to_uid = ''
    
    
    user = get_item("ProfilesDB", {'user_id': user_id})
    to_user_id = get_item("uidDB", {'uid': to_uid})['user_id']
    to_user = get_item("ProfilesDB", {'user_id': to_user_id})
    if user == None:
        return {
            'statusCode': 200,
            'body': json.dumps('not a valid user')
        }
    # print(user)
    # if 'user_name' in user:
    #     print('yes')
    
    chat_ids = user['chat_ids']
    chat_id = ''
    # find if this chat exists
    for id in chat_ids:
        print(1)
        chat = get_item("ChatDB", {'chat_id': id})
        print('chat: ',chat)
        if to_user_id in list(chat.values()):
            chat_id = chat['chat_id']
    # if not, create one
    if not chat_id:
        chat_id = str(uuid.uuid4())
        chat = {
            'chat_id': chat_id,
            'uid1': user['uid'],
            'user_id1': user['user_id'],
            'user_name1': user['user_name'],
            'uid2': to_user['uid'],
            'user_id2': to_user['user_id'],
            'user_name2': to_user['user_name'],
            'chats': [],
            'last_content': ''
        }
        # save in chatDB, save id to two people's profile
        put_item("ChatDB", chat)
        user['chat_ids'].append(chat_id)
        to_user['chat_ids'].append(chat_id)
        put_item("ProfilesDB", user)
        put_item("ProfilesDB", to_user)
    
    response = {
        'chat_id': chat_id
    }
    return {
        'statusCode': 200,
        'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
            },
        'body': json.dumps(response)
    }
