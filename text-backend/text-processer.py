import json
import boto3
import urllib3
import base64

DDB_CLIENT = boto3.client('dynamodb')

def lambda_handler(event, context):
        
    action = event['rawPath'][1:]
    details = json.loads(event['body'])
    
    token = None
    contents = None
    summarize = False
    
    if 'token' in details:
        token = details['token']
    if 'contents' in details:
        contents = details['contents']
    if 'summarize' in details:
        summarize = details['summarize'] == 'True'
    
    if action == "copy":
        if token == None or contents == None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'missing argument'
                })
            }
        return {
            'statusCode': 200,
            'body': json.dumps(copy(token, contents, summarize))
        }
    elif action == "paste":
        if token == None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'missing argument'
                })
            }
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'contents': paste(token)
            })
        }
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'success': False,
                'error': 'unrecognized path'
            })
        }

def copy(token, contents, summarize):
    if summarize:
        http = urllib3.PoolManager()
        fields = {
            'key':'[INSERT MEANINGCLOUD API KEY HERE]',
            'txt': contents,
            'sentences': int(0.4 * contents.count('.'))
        }
        r = http.request_encode_body('POST', 'http://api.meaningcloud.com/summarization-1.0', fields)
    
        contents = json.loads(r.data.decode('UTF-8'))['summary']
    
    response = DDB_CLIENT.put_item(
        TableName='copied',
        Item={
            'token': {
                'S': token
            },
            'contents': {
                'S': contents
            }
        }
    )
    
    return {
        'success': True,
        'summary': contents
    }
    
def paste(token):
    response = DDB_CLIENT.get_item(
        TableName='copied',
        Key={
            'token': {
                'S': token
            }
        }
    )
    
    return response['Item']['contents']['S']
