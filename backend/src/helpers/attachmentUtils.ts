import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

export class AttachmentUtils {
    constructor(
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
    ) { }

    async createAttachmentPresignedUrl(attachmentId: string): Promise<string> {
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: attachmentId,
            Expires: parseInt(this.urlExpiration)
        })
    }

    getAttachmentUrl(attachmentId: string): string {
        const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`
        return attachmentUrl
    }
}