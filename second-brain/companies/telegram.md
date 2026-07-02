# Telegram

**Type:** Messaging platform
**Relationship:** SIINDEX community infrastructure — announcement channel + private Founders Circle
**Status:** Active

## Key Assets

### IN$DEX Announcement Channel
- Handle: @imagenationdex
- Subscribers: 2 (at Session 61)
- SIINDEXbot is admin with full permissions

### IN$DEX Founders Circle
- Type: Private supergroup (auto-upgraded from basic group when bot added as admin — expected Telegram behaviour)
- Original chat ID: -5512185356
- Supergroup ID: -1004372531753
- Description: "Private group for IN$DEX founders and early believers. Sovereign access only."
- SIINDEXbot: promoted to admin with full permissions

## Technical Notes

- Telegram Web A (web.telegram.org/a) required for "Add Admin" with global bot search
- Telegram Web K does NOT return bot results in Add Admin modal
- Supergroup migration is irreversible — ID changes when basic group → supergroup

## SIINDEXbot
- Bot admin on both channel and Founders Circle supergroup
- Full admin permissions on both
- Token should be moved to Supabase secrets (pending — noted in Session 62 Next)

**Last referenced:** Sessions 61–62
