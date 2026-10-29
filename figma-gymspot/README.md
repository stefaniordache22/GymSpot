# Preserve the edited Figma design

The Figma MCP account limit prevented reading or updating the latest cloud design in this session. The existing file has not been overwritten, and the original screen-generation script must not be rerun over your edits.

This small development plugin is a manual fallback for the brand rename. In Figma Desktop, choose Plugins → Development → Import plugin from manifest, select `figma-gymspot/manifest.json`, open the edited page, and run **GymSpot branding update**. It changes only text layers beginning with the Spotter brand, retains text formatting with range edits, and preserves node IDs, colors, layout and prototype links. It leaves phrases such as “Your next spotter” untouched. Rename the file itself to GymSpot using Figma's file menu.

This fallback has not been executed against the edited Figma file. New Apple Health controls and menu prototype animation states still need design synchronization after access is restored.
