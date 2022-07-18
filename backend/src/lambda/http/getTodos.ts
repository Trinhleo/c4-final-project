import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';

import { getTodosForUser } from '../../businessLogic/todos';
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger';

const logger = createLogger('getTodos');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${{ event: event }}`);

    const userId = getUserId(event);
    logger.info(`Fetching all todos for user ${userId}`);

    const todos = await getTodosForUser(userId);

    logger.info(`Fetched all todos for user ${userId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: todos,
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

