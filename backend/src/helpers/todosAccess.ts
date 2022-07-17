import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { createLogger } from '../utils/logger';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';

let XAWS;
if (process.env._X_AMZN_TRACE_ID) {
  XAWS = require('aws-xray-sdk').captureAWS(AWS);
} else {
  console.log('Serverless Offline detected; skipping AWS X-Ray setup');
  XAWS = AWS;
}

const logger = createLogger(XAWS);
export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) { }

  async GetTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all todo items for user ${userId}`);

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false,
      })
      .promise();

    return result.Items as TodoItem[];
  }

  async CreateTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating new todo item!');
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem,
      })
      .promise();
    logger.info('Created new todo item!');
    return todoItem;
  }

  async UpdateTodo(todoItem: TodoUpdate, userId: string, todoId: string): Promise<TodoUpdate> {
    logger.info(`Updating todo with Id ${todoId}`);

    const { Attributes } = await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId,
        },
        ConditionExpression: 'todoId = :todoId',
        UpdateExpression:
          'set #todo_name = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeValues: {
          ':name': todoItem.name,
          ':dueDate': todoItem.dueDate,
          ':done': todoItem.done,
          ':todoId': todoId,
        },
        ExpressionAttributeNames: {
          '#todo_name': 'name',
        },
        ReturnValues: 'UPDATED_NEW',
      })
      .promise();

    logger.info(
      `Updated todo with Id ${todoId} for user ${userId}`
    );

    return Attributes as TodoUpdate;
  }

  async UpdateAttachmentUrl(
    userId: string,
    todoId: string,
    attachmentUrl: string
  ) {
    logger.info(
      `Updating attachment url ${attachmentUrl} with todo id ${todoId} for user ${userId}`
    );

    const result = await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId,
        },
        ExpressionAttributeNames: {
          '#todo_attachmentUrl': 'attachmentUrl',
        },
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl,
        },
        UpdateExpression: 'SET #todo_attachmentUrl = :attachmentUrl',
        ReturnValues: 'UPDATED_NEW',
      })
      .promise();

    logger.info(`Updated with result ${result}`);
  }

  async DeleteTodo(todoId: string, userId: string): Promise<string> {
    logger.info(`Deleting todo with Id ${todoId}`);

    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId,
        },
        ConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: {
          ':todoId': todoId,
        },
      })
      .promise();

    return userId;
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance');
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8001',
    });
  }

  return new XAWS.DynamoDB.DocumentClient();
}
