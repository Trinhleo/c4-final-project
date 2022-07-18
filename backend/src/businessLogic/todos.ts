import * as uuid from 'uuid';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { createLogger } from '../utils/logger';
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoAccess } from '../dataLayer/todosAccess';

const logger = createLogger('todos');
const todosAccess = new TodoAccess();
const attachmentUtils = new AttachmentUtils();

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all todos for user ${userId}`);
    return todosAccess.GetTodosForUser(userId);
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {
    logger.info(`Creating new Todo for user ${userId}`);

    const todoId = uuid.v4();
    const createdAt = new Date().toISOString();

    return await todosAccess.CreateTodo({
        userId,
        todoId,
        createdAt,
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
    });
}

export async function updateTodo(
    todoId: string,
    userId: string,
    updateTodoRequest: UpdateTodoRequest
): Promise<TodoUpdate> {
    logger.info(`Updating todo ${todoId} of user ${userId}`);

    return await todosAccess.UpdateTodo(
        {
            name: updateTodoRequest.name,
            dueDate: updateTodoRequest.dueDate,
            done: updateTodoRequest.done,
        },
        userId,
        todoId
    );
}

export async function deleteTodo(todoId: string, userId: string) {
    logger.info(`Deleting todo ${todoId} for user ${userId}`);

    return await todosAccess.DeleteTodo(todoId, userId);
}

export async function createAttachmentPresignedUrl(
    userId: string,
    todoId: string
): Promise<String> {
    const uploadUrl = await attachmentUtils.createAttachmentPresignedUrl(todoId);

    logger.info(`Upload url is ${uploadUrl}`);

    const attachmentUrl = attachmentUtils.getAttachmentUrl(todoId);

    logger.info(`AttachmentUrl is ${attachmentUrl}`);

    await todosAccess.UpdateAttachmentUrl(userId, todoId, attachmentUrl);

    logger.info(`Updated attachment url for todo ${todoId} of user ${userId}`);
    return uploadUrl;
}
