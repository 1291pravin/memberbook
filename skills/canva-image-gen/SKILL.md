---
name: canva-image-gen
description: >
  Generate social media images and graphics from text descriptions using Canva MCP integration.
  Triggers on: "create an image", "generate a graphic", "make a post for Instagram", "make a post for Twitter",
  "make a post for LinkedIn", "design a banner", "WhatsApp status image", "YouTube thumbnail",
  "Facebook post image", "Pinterest pin", "TikTok cover", or any social media visual content creation request.
  Also triggers on: "create a social media image", "design a poster", "make a flyer",
  "generate an infographic", or any request to create visual content for a specific social platform.
  Do NOT use for: code-rendered art (use canvas-design), presentations (use pptx), or document creation (use docx).
---

# Social Media Image Generator (Canva)

Generate professional social media graphics via the Canva MCP tools.

## Platform-to-Design-Type Mapping

Use `design_type` from the Canva `generate-design` tool. Match the user's target platform:

| Platform | design_type | Dimensions |
|---|---|---|
| Instagram Post | `instagram_post` | 1080x1080 |
| Instagram Story/Reels | `your_story` | 1080x1920 |
| WhatsApp Status | `your_story` | 1080x1920 |
| Twitter/X Post | `twitter_post` | 1600x900 |
| Facebook Post | `facebook_post` | 1200x630 |
| Facebook Cover | `facebook_cover` | -- |
| LinkedIn Post | `instagram_post` | 1200x1200 |
| Pinterest Pin | `pinterest_pin` | 1000x1500 |
| YouTube Thumbnail | `youtube_thumbnail` | 1280x720 |
| YouTube Banner | `youtube_banner` | -- |
| TikTok Cover | `your_story` | 1080x1920 |
| Poster | `poster` | -- |
| Flyer | `flyer` | -- |
| Infographic | `infographic` | -- |

For LinkedIn (1200x1200), generate as `instagram_post` (1080x1080) then resize to custom 1200x1200.

## Workflow

### 1. Parse the request
- Identify target platform (default: Instagram Post if unclear)
- Extract the content/theme description
- Note any brand, color, or style preferences

### 2. Check brand kit (if relevant)
If the user mentions brand consistency or "on-brand", call `mcp__claude_ai_Canva__list-brand-kits` and let the user pick one. Pass the `brand_kit_id` to `generate-design`.

### 3. Generate the design
Call `mcp__claude_ai_Canva__generate-design` with:
- `design_type`: from the mapping table above
- `query`: a detailed, descriptive prompt combining the user's request with platform context. Be specific about colors, mood, text content, and layout.
- `brand_kit_id`: if selected
- `user_intent`: brief summary of user goal

The tool returns multiple design candidates with preview thumbnails. Show all previews to the user and ask them to pick one.

### 4. Create the design from candidate
After the user picks a candidate, call `mcp__claude_ai_Canva__create-design-from-candidate` with the `job_id` and `candidate_id`. This returns a `design_id`.

### 5. Resize if needed
If the target platform requires custom dimensions not matching the default `design_type` (e.g., LinkedIn 1200x1200), call `mcp__claude_ai_Canva__resize-design`:
```
design_type: { type: "custom", width: <W>, height: <H> }
```

### 6. Iterate on the design (optional)
If the user wants edits:
1. `mcp__claude_ai_Canva__start-editing-transaction` with the `design_id`
2. `mcp__claude_ai_Canva__perform-editing-operations` with the desired changes
3. `mcp__claude_ai_Canva__get-design-thumbnail` to preview changes (show to user)
4. `mcp__claude_ai_Canva__commit-editing-transaction` after user approval

### 7. Export the final image
1. Call `mcp__claude_ai_Canva__get-export-formats` to check available formats
2. Call `mcp__claude_ai_Canva__export-design` with:
   - `format.type`: `"png"` (default, best for social media) or `"jpg"`
   - `format.width` / `format.height`: target platform dimensions from the table
3. Share the download URL with the user

## Multi-Platform Adaptation
If the user wants the same design for multiple platforms:
1. Generate and finalize the design for the primary platform
2. For each additional platform, call `mcp__claude_ai_Canva__resize-design` with the target dimensions
3. Export each resized version

## Prompt Crafting Tips
When building the `query` for `generate-design`, enrich the user's description:
- Add platform context: "Instagram post about..." or "YouTube thumbnail for..."
- Include visual style cues: "modern", "minimalist", "vibrant", "professional"
- Specify text to include on the image if the user provided any
- Mention color preferences or mood if stated
