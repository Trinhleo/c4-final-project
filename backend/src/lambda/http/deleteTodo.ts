import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { deleteTodo } from '../../businessLogic/todos'

const logger = createLogger('deleteTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${{ event: event }}`);

    const todoId = event.pathParameters.todoId
    const userId = getUserId(event);
    logger.info(`Deleting todo ${todoId} for user ${userId}`);

    await deleteTodo(todoId, userId);

    logger.info(`Deleted todo ${todoId} for user ${userId}`);

    return {
      statusCode: 204,
      body: ''
    };
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
