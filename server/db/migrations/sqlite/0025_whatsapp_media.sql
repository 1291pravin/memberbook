-- Photos, files and voice notes people send to the MemberBook WhatsApp number
-- (for example photos of a register to load). JSON: { mediaId, key, name, type, size }.
-- key is empty when the download from Meta failed; mediaId stays valid ~30 days.
ALTER TABLE `whatsapp_messages` ADD `media` text;
