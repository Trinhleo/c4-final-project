import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';

import { getUserId } from '../utils';
import { createAttachmentPresignedUrl } from '../../helpers/todos';
import { createLogger } from '../../utils/logger';

const logger = createLogger('generateUploadUrl');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${{ event: event }}`);

    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);

    logger.info(`createAttachmentPresignedUrl todo ${todoId} for user ${userId}`);
    const uploadUrl = await createAttachmentPresignedUrl(userId, todoId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl,
      }),
    };
  }
);

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )

