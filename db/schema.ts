import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const triviaBoards = sqliteTable('trivia_boards', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  revision: integer('revision').notNull(),
});
