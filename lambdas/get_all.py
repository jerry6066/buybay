import boto3
import json
import math
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb")

show_num = 20

###############################################
# main

def lambda_handler(event, context):
    # print(event)
    page = int(event['path'].split("/page/")[1])
    # print('page: ',page)
    # page = ''
    # num_pages = math.ceil(5/2)
    # print('num_pages', num_pages)
    
    is_first_page = False
    is_last_page = False
    
    table = dynamodb.Table("ItemsDB")
    results = table.scan()["Items"]
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
    # a = [0, 1, 2,3,4]
    # print(a[idx1:idx2])
    
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
