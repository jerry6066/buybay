import boto3
import json
import math
from botocore.exceptions import ClientError

import sys
sys.path.insert(1,'/home/ubuntu/build/python/lib/python3.6/site-packages')
from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

dynamodb = boto3.resource("dynamodb")
host = ''
region = 'us-east-1'
service = 'es'
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

show_num = 20
##########################################################
# utils

def get_item(table_name, key):
    table = dynamodb.Table(table_name)
    try:
        response = table.get_item(Key = key)
    except ClientError as e:
        print(e.response['Error']['Message'])
        raise
    return response

##########################################################
# main

def lambda_handler(event, context):
    print(event)
    content = event['path'].split('/search/')[1]
    content = content.split('/page/')
    
    page = int(content[1])
    key_words = content[0].split('%20')
    # print(page)
    # print(key_words)
    # page = ''
    # key_words = ['a']
    
    is_first_page = False
    is_last_page = False
    
    # table = dynamodb.Table("ItemsDB")
    # results = table.scan()["Items"]
    results = []
    for key in key_words:
        response_es = es.search(index="items", body={"query": {"match":{"key_words": key}}})
        query = response_es['hits']['hits']
        
        for q in query:
            print('query result: ', q)
            result = get_item("ItemsDB", {"item_id": q['_source']['item_id']})
            if 'Item' in result:
                if result not in results:
                    results.append(result['Item'])
    # print(results)
    
    num_pages = math.ceil(len(results)/show_num)
    print('num pages: ', num_pages)
    
    if page == '' or page <= 1:
        page = 1
        is_first_page = True
    
    if page >= num_pages:
        page = num_pages
        is_last_page = True
        if page == 1:
            is_first_page = True
    
    print('page: ',page)
    idx1 = show_num * (page-1)
    idx2 = min(show_num * page, len(results))
    
    items = []
    for info in results[idx1:idx2]:
        if info['status']:
            status = 'out of stock'
        else:
            status = 'in stock'
        item = {
            'item_id': info['item_id'],
            'item_name': info['item_name'],
            'user_id': info['user_id'],
            'user_name': info['user_name'],
            'price': info['price'],
            'main_img_url': info['main_img_url'],
            'num_visits': str(info['num_visits']),
            'timestamp': info['timestamp'].split(" ")[0],
            'status': status
        }
        items.append(item)
    # print('items: ',items)
    
    response = {
        "status": True,
        "key_words": " ".join(key_words),
        "items": items,
        "page": str(page),
        "is_first_page": str(is_first_page),
        "is_last_page": str(is_last_page)
    }
    print(response)
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
