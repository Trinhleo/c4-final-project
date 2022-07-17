import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { updateTodo } from '../../businessLogic/todos'

const logger = createLogger('updateTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${{ event: event }}`);

    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

    logger.info(`Updating todo ${todoId} of user ${userId}`);

    await updateTodo(todoId, userId, updatedTodo);

    logger.info(`Updated todo ${todoId} of user ${userId}`);

    return {
      statusCode: 204,
      body: ''
    };
  });

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
