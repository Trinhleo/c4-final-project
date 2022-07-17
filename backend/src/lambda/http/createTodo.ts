import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'source-map-support/register';
import * as middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest';
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger';
import { createTodo } from '../../businessLogic/todos';

const logger = createLogger('createTodo');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${{ event: event }}`);

    const newTodo: CreateTodoRequest = JSON.parse(event.body);

    const userId = getUserId(event);

    logger.info(`Creating todo item for user ${userId}`);

    const item = await createTodo(newTodo, userId);

    logger.info(`Created new todo item for user ${userId}`);

    return {
      statusCode: 201,
      body: JSON.stringify({
        item,
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

