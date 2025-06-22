# Photo Sharing App with Automatic Image Resizing

A serverless photo sharing application that automatically creates thumbnails of uploaded images using AWS Lambda, S3, and API Gateway. The frontend is hosted on S3 with static website hosting and features direct S3 uploads with automatic thumbnail generation.

## 🌐 Live Demo
**Frontend URL**: `http://amalitech-photo-sharing-app-202506.s3-website-eu-west-1.amazonaws.com`

## 📋 Project Overview

This application demonstrates a complete serverless image processing pipeline with the following flow:

1. **Frontend Loading**: Static website hosted on S3 loads resized images from the secondary bucket via API Gateway
2. **Image Display**: Thumbnails are retrieved through a Lambda function and displayed in a responsive gallery
3. **Direct Upload**: Users upload images directly to the primary S3 bucket using the bucket URL
4. **Automatic Processing**: S3 event triggers Lambda function to create thumbnails in the secondary bucket
5. **Real-time Updates**: Frontend refreshes to show newly processed thumbnails

## 🏗️ Architecture & Data Flow

```
S3 Frontend Hosting → API Gateway → Lambda (Get Images) → S3 Secondary Bucket (Thumbnails)
        ↓                                                           ↑
Direct Upload to S3 Primary Bucket → Lambda (Resize) → Creates Thumbnails
```

### Application Flow:
1. User accesses frontend hosted on S3 static website
2. Frontend calls API Gateway endpoint to load existing thumbnails
3. `photoResizeGetImages` Lambda retrieves thumbnail list from secondary bucket
4. User uploads new image directly to primary S3 bucket
5. S3 event notification triggers `imageResizer` Lambda
6. Resize function creates thumbnail and stores in secondary bucket
7. Frontend refreshes to display new thumbnails

## 📦 S3 Buckets Configuration

### Primary Bucket (Original Images + Frontend Hosting)
- **Name**: `amalitech-photo-sharing-app-202506`
- **Purpose**: 
  - Hosts static frontend website
  - Receives direct image uploads from users
- **Features**:
  - Static website hosting enabled
  - CORS configured for direct uploads
  - Event notifications for Lambda triggers

### Secondary Bucket (Thumbnails)
- **Name**: `amalitech-photo-serving-app-202506`
- **Purpose**: Stores resized thumbnail images (150x150px)
- **Features**:
  - All thumbnails prefixed with `thumb-`
  - Public read access for frontend display
  - CORS enabled for API access

## 🔧 Lambda Functions

### 1. Image Resize Function (`image_resize/`)
**Function Name**: `imageResizer`
**Purpose**: Automatically resize uploaded images and create thumbnails

**Trigger**: S3 Object Created events from primary bucket

**Key Features**:
- Resizes images to 150x150 pixels while maintaining aspect ratio
- Supports multiple image formats (JPEG, PNG, GIF, BMP, WebP)
- Adds `thumb-` prefix to thumbnail filenames
- Handles error cases and comprehensive logging

**Environment Variables**:
```
SOURCE_BUCKET=amalitech-photo-sharing-app-202506
DESTINATION_BUCKET=amalitech-photo-serving-app-202506
THUMBNAIL_WIDTH=150
THUMBNAIL_HEIGHT=150
THUMBNAIL_PREFIX=thumb-
```

### 2. Images Get Function (`images_get/`)
**Function Name**: `photoResizeGetImages`
**Purpose**: Retrieve and serve thumbnail images to frontend via API Gateway

**Features**:
- Lists all thumbnail images from secondary bucket
- Filters for image files only
- Returns formatted JSON with image URLs and metadata
- CORS-enabled for browser compatibility
- Constructs public S3 URLs for direct access

**Response Format**:
```json
{
  "images": [
    {
      "name": "example.jpg",
      "url": "https://bucket.s3.region.amazonaws.com/thumb-example.jpg",
      "lastModified": "2025-01-15T10:30:00.000Z",
      "size": 12345
    }
  ]
}
```

## 🌐 API Gateway Configuration

### Base URL: `https://amlngmq685.execute-api.eu-west-1.amazonaws.com/prod`

**Endpoints**:
- `GET /images` - Retrieve list of thumbnail images (connected to `photoResizeGetImages`)
- `GET /images/{image}` - Retrieve a thumbnail image (connected to `amalitech-photo-serving-app-202506`)

**CORS Configuration**:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## 🎨 Frontend Implementation

### Hosting Configuration
- **Static Website Hosting**: Enabled on primary S3 bucket
- **Index Document**: `index.html`
- **Error Document**: `error.html`
- **CORS Policy**: Configured for direct uploads and API calls

### Modern UI Features
- **Drag & Drop Upload**: Intuitive file upload interface
- **Direct S3 Upload**: Files uploaded directly to S3 without Lambda processing
- **Responsive Gallery**: Grid layout displaying thumbnails with metadata
- **Real-time Updates**: Automatic refresh after successful uploads
- **Progress Indicators**: Visual feedback during upload process

### Technical Implementation
- **Vanilla JavaScript**: No external dependencies
- **Direct S3 Upload**: Uses S3 bucket URL for file uploads
- **API Integration**: Fetches thumbnails via API Gateway
- **Error Handling**: Graceful error management and user feedback

## 🚀 Complete Setup Process

### Step 1: S3 Buckets Setup
1. **Primary Bucket** (`amalitech-photo-sharing-app-202506`):
   - Enable static website hosting
   - Configure CORS for direct uploads
   - Set up event notifications for Lambda triggers
   - Upload frontend files (HTML, CSS, JS)

2. **Secondary Bucket** (`amalitech-photo-serving-app-202506`):
   - Configure for thumbnail storage
   - Set appropriate public access policies
   - Enable CORS for API access

### Step 2: Lambda Functions Deployment
1. **Deploy `imageResizer`**:
   - Add PIL/Pillow layer for image processing
   - Configure S3 trigger on primary bucket
   - Set environment variables for bucket names

2. **Deploy `photoResizeGetImages`**:
   - Configure for API Gateway integration
   - Set environment variables for secondary bucket
   - Enable CORS in function response

### Step 3: API Gateway Configuration
1. Create REST API with `/images` resource
2. Connect GET method to `photoResizeGetImages`
3. Enable CORS for browser compatibility
4. Deploy to production stage

### Step 4: Frontend Configuration
1. Update API endpoint URLs in JavaScript
2. Configure direct S3 upload URLs
3. Upload frontend files to primary bucket
4. Test complete upload and display flow

## 📸 CORS Configuration

### S3 Bucket CORS (Primary Bucket)
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-custom-header",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Lambda Function CORS Headers
```python
"headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
}
```

## 🔄 Image Processing Pipeline

1. **Frontend Load**: User accesses S3-hosted website
2. **Thumbnail Retrieval**: Frontend calls API Gateway → `photoResizeGetImages` → Returns thumbnail URLs
3. **Image Upload**: User uploads image directly to primary S3 bucket
4. **Automatic Processing**: S3 event triggers `imageResizer`
5. **Thumbnail Creation**: Lambda processes image and stores thumbnail in secondary bucket
6. **Display Update**: Frontend refreshes to show new thumbnails

## 📊 Key Features

### Direct S3 Upload Benefits
- **Performance**: No Lambda processing during upload
- **Cost Effective**: Reduced Lambda execution time
- **Scalability**: Direct S3 handles high upload volumes
- **Reliability**: Fewer points of failure in upload process

### Automatic Thumbnail Generation
- **Event-Driven**: Triggered automatically on upload
- **Consistent Sizing**: All thumbnails standardized to 150x150px
- **Format Support**: Handles multiple image formats
- **Error Handling**: Robust error management and logging

## 🛠️ Technologies Used

- **AWS S3**: Static website hosting and object storage
- **AWS Lambda**: Serverless image processing and API functions
- **Amazon API Gateway**: RESTful API for thumbnail retrieval
- **Python PIL/Pillow**: Image processing library
- **HTML/CSS/JavaScript**: Modern frontend development
- **CloudWatch**: Comprehensive logging and monitoring

## 📈 Monitoring & Troubleshooting

- **CloudWatch Logs**: Monitor both Lambda functions
- **S3 Metrics**: Track upload and storage usage
- **API Gateway Logs**: Monitor thumbnail retrieval requests
- **CORS Issues**: Verify bucket and API Gateway CORS settings
- **Upload Failures**: Check S3 permissions and CORS configuration

## 🔒 Security Considerations

- **Public Access**: Controlled public access for thumbnail display
- **CORS Policies**: Properly configured for secure browser access
- **IAM Roles**: Least privilege access for Lambda functions
- **Input Validation**: File type and size restrictions
- **Error Handling**: Secure error messages without sensitive information

## 📷 Setup Process Screenshots

The following screenshots document the complete setup process for this serverless photo sharing application:

### 1. S3 Bucket Creation
![S3 Buckets Setup](screenshots/1%20created%20two%20buckets.png)
*Created two S3 buckets: primary bucket for original images and frontend hosting, secondary bucket for storing resized thumbnails.*

### 2. IAM Role Configuration
![IAM Role Setup](screenshots/2%20created%20role%20with%20access%20to%20S3%20and%20lambda%20execution.png)
*Created IAM execution role with necessary permissions for Lambda functions to access S3 buckets and CloudWatch logs.*

### 3. Lambda Function Deployment
![Lambda Function Creation](screenshots/3%20created%20lambda%20function.png)
*Deployed the image resize Lambda function with PIL/Pillow layer for image processing capabilities.*

### 4. S3 Event Notification Setup
![S3 Event Configuration](screenshots/4%20created%20event%20notification%20to%20fire%20when%20objected%20is%20added%20to%20bucket.png)
*Configured S3 bucket event notifications to trigger Lambda function when new objects are uploaded.*

### 5. Lambda Trigger Integration
![Lambda Trigger Setup](screenshots/5%20added%20lambda%20function%20to%20the%20event%20notification.png)
*Connected the image resize Lambda function to S3 event notifications for automatic thumbnail generation.*

### 6. Image Upload Testing
![Image Upload Test](screenshots/6%20added%20image%20to%20the%20main%20bucket.png)
*Tested the system by uploading an image to the primary S3 bucket to verify the trigger mechanism.*

### 7. Lambda Function Monitoring
![Lambda Execution Logs](screenshots/7%20lambda%20logs%20requests.png)
*CloudWatch logs showing successful Lambda function execution and image processing activities.*

### 8. Thumbnail Generation Verification
![Thumbnail Creation](screenshots/8%20resized%20image%20appears%20in%20the%20second%20bucket.png)
*Confirmed automatic thumbnail creation in the secondary bucket with proper naming convention (thumb- prefix).*

### 9. API Gateway Resource Creation
![API Gateway Setup](screenshots/9%20creating%20API%20resource.png)
*Created REST API resources in API Gateway for handling image retrieval requests from the frontend.*

### 10. Single Image Resource Configuration
![Single Image API](screenshots/10%20created%20resource%20to%20get%20a%20single%20image.png)
*Configured API Gateway resource for retrieving individual images with proper HTTP methods and CORS settings.*

### 11. API Deployment
![API Staging](screenshots/11%20API%20resource%20staged.png)
*Deployed API Gateway resources to production stage, making endpoints available for frontend integration.*

### 12. API Testing
![API Response Test](screenshots/12%20image%20received%20using%20staged%20invoke%20url.png)
*Tested API Gateway endpoints to ensure proper image retrieval and JSON response formatting.*

### 13. Images List API Resource
![Images List API](screenshots/13%20added%20resource%20to%20get%20images%20in%20the%20resize%20bucket.png)
*Added API Gateway resource to retrieve list of all thumbnail images from the secondary bucket.*

### 14. Complete Application Integration
![Frontend Integration](screenshots/14%20serve%20frontend%20to%20load%20resized%20images%20and%20put%20image%20into%20main%20bucket.png)
*Final integration showing frontend application loading resized images via API Gateway and enabling direct uploads to S3.*

### 15. CORS Configuration
![CORS Configuration](screenshots/15%20setting%20cors%20on%20bucket%20to%20allow%20only%20frontend%20to%20put%20objects%20directly.png)
*Added CORS configuration to the S3 bucket to restrict direct uploads to only the frontend application.*

## 🎯 Future Enhancements

- **User Authentication**: AWS Cognito integration
- **Multiple Thumbnail Sizes**: Various resolution options
- **Image Metadata**: EXIF data extraction and display
- **CDN Integration**: CloudFront for faster global delivery
- **Batch Processing**: Handle multiple uploads efficiently
- **Advanced Filters**: Image enhancement and effects