import json
import boto3
from PIL import Image
import io
import os
import logging
import urllib.parse

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize S3 client
s3_client = boto3.client('s3')

# Get environment variables
SOURCE_BUCKET = os.environ.get('SOURCE_BUCKET', 'photo-sharing-app-bucket')
DESTINATION_BUCKET = os.environ.get('DESTINATION_BUCKET', 'photo-sharing-thumbnails')
THUMBNAIL_WIDTH = int(os.environ.get('THUMBNAIL_WIDTH', 300))
THUMBNAIL_HEIGHT = int(os.environ.get('THUMBNAIL_HEIGHT', 300))
THUMBNAIL_PREFIX = os.environ.get('THUMBNAIL_PREFIX', 'thumb-')

def lambda_handler(event, context):
    """
    Lambda function triggered by S3 events to resize uploaded images
    
    Parameters:
    - event: S3 event
    - context: Lambda context
    
    Returns:
    - Processing result
    """
    logger.info('Image resize request received')
    
    # Extract bucket and key from event
    try:
        # Check if this is an S3 event
        if 'Records' in event and len(event['Records']) > 0:
            # Process S3 event notification
            for record in event['Records']:
                if 'eventSource' in record and record['eventSource'] == 'aws:s3':
                    bucket = record['s3']['bucket']['name']
                    key = urllib.parse.unquote_plus(record['s3']['object']['key'])
                    
                    # Process the image
                    process_image(bucket, key)
        else:
            # Direct invocation with bucket and key in the event
            bucket = event.get('bucket', SOURCE_BUCKET)
            key = event.get('key')
            
            if not key:
                logger.error('No key specified in the event')
                return {
                    'statusCode': 400,
                    'body': json.dumps({'message': 'No image key specified'})
                }
            
            # Process the image
            process_image(bucket, key)
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Image processing completed successfully'})
        }
        
    except Exception as e:
        logger.error(f'Error processing image: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'message': f'Error processing image: {str(e)}'})
        }

def process_image(bucket, key):
    """
    Resize an image and upload the thumbnail to the destination bucket
    
    Parameters:
    - bucket: Source S3 bucket name
    - key: Image key/path in the source bucket
    """
    logger.info(f'Processing image: {key} from bucket: {bucket}')
    
    # Skip processing if this is already a thumbnail
    if key.startswith(THUMBNAIL_PREFIX):
        logger.info(f'Skipping thumbnail: {key}')
        return
    
    # Skip non-image files
    if not is_image(key):
        logger.info(f'Skipping non-image file: {key}')
        return
    
    try:
        # Download the image from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        image_content = response['Body'].read()
        
        # Open the image with PIL
        with Image.open(io.BytesIO(image_content)) as image:
            # Get image format
            image_format = image.format
            
            # Resize the image while maintaining aspect ratio
            image.thumbnail((THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT))
            
            # Convert to RGB if necessary (for JPEG format)
            if image_format == 'JPEG' and image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Save the resized image to a bytes buffer
            buffer = io.BytesIO()
            image.save(buffer, format=image_format)
            thumbnail_content = buffer.getvalue()
        
        # Create the thumbnail key
        thumbnail_key = f"{THUMBNAIL_PREFIX}{key}"
        
        # Upload the thumbnail to the destination bucket
        content_type = response.get('ContentType', f'image/{image_format.lower()}')
        s3_client.put_object(
            Bucket=DESTINATION_BUCKET,
            Key=thumbnail_key,
            Body=thumbnail_content,
            ContentType=content_type
        )
        
        logger.info(f'Successfully created thumbnail: {thumbnail_key}')
        
    except Exception as e:
        logger.error(f'Error processing {key}: {str(e)}')
        raise

def is_image(key):
    """
    Check if the file is an image based on its extension
    
    Parameters:
    - key: File key/path
    
    Returns:
    - Boolean indicating if the file is an image
    """
    # List of supported image extensions
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    
    # Extract file extension from key
    _, ext = os.path.splitext(key.lower())
    
    return ext in image_extensions

s3 = boto3.client('s3')

def lambda_handler(event, context):
    try:
        # Log the full event for debugging
        print("Full event:", json.dumps(event, indent=2))
        
        # Get S3 event details
        source_bucket = event['Records'][0]['s3']['bucket']['name']
        source_key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
        
        print(f"Processing: s3://{source_bucket}/{source_key}")
        
        # Skip if this is a folder or the key is empty
        if not source_key or source_key.endswith('/'):
            return {
                'statusCode': 400,
                'body': json.dumps('Skipped folder creation event')
            }
        
        # Verify object exists before processing
        s3.head_object(Bucket=source_bucket, Key=source_key)
        
        # Define target bucket
        target_bucket = "amalitech-photo-serving-app-202506"
        target_key = f"thumb-{source_key}"
        
        # Download image from S3
        response = s3.get_object(Bucket=source_bucket, Key=source_key)
        image = Image.open(io.BytesIO(response['Body'].read()))
        
        # Resize image
        image.thumbnail((150, 150))
        
        # Convert to byte stream
        buffer = io.BytesIO()
        image.save(buffer, "JPEG")
        buffer.seek(0)
        
        # Upload thumbnail
        s3.put_object(
            Bucket=target_bucket,
            Key=target_key,
            Body=buffer,
            ContentType="image/jpeg"
        )
        
        print(f"Successfully created thumbnail: s3://{target_bucket}/{target_key}")
        return {
            'statusCode': 200,
            'body': json.dumps(f'Thumbnail created: {target_key}')
        }
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise e
