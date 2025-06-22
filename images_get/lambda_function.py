import json
import boto3
from botocore.exceptions import ClientError
import os

def lambda_handler(event, context):
    # Get the bucket name from environment variable or use default
    bucket_name = os.environ.get('BUCKET_NAME', 'amalitech-photo-sharing-app-202506')
    region = os.environ.get('AWS_REGION', 'eu-west-1')
    
    # Initialize S3 client
    s3 = boto3.client('s3')
    
    try:
        # List all objects in the bucket
        response = s3.list_objects_v2(Bucket=bucket_name)
        
        # Check if there are any objects
        if 'Contents' not in response:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'  # For CORS support
                },
                'body': json.dumps({
                    'images': []
                })
            }
        
        # Filter for image files and format the response
        images = []
        for item in response['Contents']:
            key = item['Key']
            # Skip if not an image file
            if not is_image_file(key):
                continue
                
            # Create a pre-signed URL (optional, for private buckets)
            # url = s3.generate_presigned_url('get_object',
            #                               Params={'Bucket': bucket_name, 'Key': key},
            #                               ExpiresIn=3600)
            
            # For public buckets, construct the URL directly
            url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{key}"
            
            # Get file name from the key
            file_name = key.split('/')[-1]
            
            images.append({
                'name': file_name,
                'url': url,
                'lastModified': item['LastModified'].isoformat(),
                'size': item['Size']
            })
        
        # Return formatted response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'  # For CORS support
            },
            'body': json.dumps({
                'images': images
            })
        }
        
    except ClientError as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': f"Error retrieving images: {str(e)}"
            })
        }

def is_image_file(filename):
    """Check if a filename has an image extension"""
    if not filename:
        return False
    
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    filename_lower = filename.lower()
    
    return any(filename_lower.endswith(ext) for ext in image_extensions)