import boto3
import base64
import json
import uuid
import datetime
from botocore.exceptions import ClientError

import sys
sys.path.insert(1,'/home/ubuntu/build/python/lib/python3.6/site-packages')
from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

##################################
# configs
s3 = boto3.resource('s3')
s3_url = ''
dynamodb = boto3.resource("dynamodb")

host = ''
region = 'us-east-1'
service = 'es'
# credentials = boto3.Session().get_credentials()
access_key = ""
secret_key = ""
awsauth = AWS4Auth(access_key, secret_key, region, service, session_token=None)

es = Elasticsearch(
    hosts = [{'host': host, 'port': 443}],
    http_auth = awsauth,
    use_ssl = True,
    verify_certs = True,
    connection_class = RequestsHttpConnection
    )

#############################
# utils

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
    
def insertES(item): 
    response = es.index(index = "items", id = item['item_id'], body = item)
    return response
    
#####################################################
#  main

def lambda_handler(event, context):
    # parse event
    # print(event)
    # item_id = "70f0f6d6-4e58-42f7-9bed-1ebef3b4dcd9"
    item_id = event['path'].split("/item/")[1]
    body = json.loads(event['body'])
    user_id = body['user_id'] # "zd2235@columbia.edu"
    item_name = body['item_name'] # 'ROG laptop'
    description = body['description'] # 'a new laptop'
    price = int(body['price']) # '1200'
    if price < 0 or price > 9999:
        price = str(0)
    else:
        price = str(price)
    category = ''
    key_words = ' '.join(item_name.split())
    key_words = key_words.split(" ")
    
    user = get_item("ProfilesDB", {"user_id": user_id})['Item']
    user_name = user['user_name']
    # uid = user['uid']
    
    if item_id != '0':
        print('update an item')
        # item_id = event['item_id']
        item = get_item("ItemsDB", {"item_id": item_id})['Item']
        if item['user_id'] == user_id:
            # print(item)
            item['item_name'] = item_name
            item['description'] = description
            item['price'] = price
            item['key_words'] = key_words
            # item['main_img_url'] = main_img_url
            # item['img_urls'] = img_urls
            es.delete(index="items" ,id=item['item_id'])
        
    else:
        print('create a new item')
        num_items = len(user['user_items'])
        max_num = 30
        if num_items >= max_num:
            response = {
                "status": False,
                "message": 'you can only create '+ str(max_num) +' items.'
            }
            return {
                'statusCode': 200,
                'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
                },
                'body': json.dumps(response)
            }
        
        item_id = str(uuid.uuid4())

        item = {
            'item_id': item_id,
            'user_id': user_id,
            'user_name': user_name,
            'item_name': item_name, 
            'description': description, 
            'price': price,
            'category': category, 
            'key_words': key_words,
            'main_img_url': '', 
            'img_urls': '', 
            'num_visits': 0, 
            'visited_user': [],
            'messages': [],
            'status': 0, 
            'timestamp': str(datetime.datetime.now() - datetime.timedelta(hours=5)).split(".")[0]
        }

        user['user_items'].append(item_id)
        put_item("ProfilesDB", user)
        
    # insert keywords to ES
    idx = {
        'item_id': item_id,
        'item_name': item_name,
        'category': category,
        'key_words': key_words
    }
    res = insertES(idx)
    # print('es put response', res)
    
    img_urls = []
    if body['main_img_base64'][0:4] == 'http':
        main_img_url = body['main_img_base64']
    else:
        base64_img = body['main_img_base64'].split(",")[1]
        obj = s3.Object('buybay', item_id+'/main_img.jpeg')
        obj.put(Body=base64.b64decode(base64_img))
        main_img_url = s3_url + item_id + '/main_img.jpeg'
        
    if body['images_base64']:
        # print('has img')
        for i in range(len(body['images_base64'])):
            if body['images_base64'][i][0:4] == 'http':
                img_urls.append(body['images_base64'][i])
            else:
                base64_img = body['images_base64'][i].split(",")[1]
                obj = s3.Object('buybay', item_id+'/img'+str(i)+'.jpeg')
                obj.put(Body=base64.b64decode(base64_img))
                img_urls.append(s3_url + item_id+'/img'+str(i)+'.jpeg')
            
    item['main_img_url'] = main_img_url
    item['img_urls'] = img_urls
    
    put_item("ItemsDB", item)
    
    response = {
        "status": True,
        "item_id": item_id
    }

    return {
        'statusCode': 200,
        'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
            },
        'body': json.dumps(response)
    }
