-- Allow content to be NULL on session_messages (file-only messages)
ALTER TABLE `session_messages` MODIFY `content` TEXT NULL;
