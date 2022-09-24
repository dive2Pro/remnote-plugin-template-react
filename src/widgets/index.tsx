import {
  declareIndexPlugin,
  ReactRNPlugin,
  RichTextInterface,
  WidgetLocation,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

export const TWEET_EMBED_POWERUP = 'TWEET_EMBED_POWERUP';
async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerPowerup('Twitter', TWEET_EMBED_POWERUP, 'Tweet embed', {
    slots: [{ code: 'tweet_embed', name: 'Tweet' }],
  });

  await plugin.app.registerWidget('tweet_embed', WidgetLocation.UnderRemEditor, {
    dimensions: { height: 'auto', width: '100%' },
    // powerupFilter: TWEET_EMBED_POWERUP,
  });

  await plugin.app.registerCommand({
    id: 'tweet_embed',
    name: 'Tweet Embed',
    action: async () => {
      try {
        console.log(
           await plugin.widget.getWidgetContext(),
          // await plugin.focus.getFocusedRem())
        )
        const focusedRem = await plugin.focus.getFocusedRem();
        console.log('action , -----', focusedRem);
        const rem = await plugin.rem.findOne(focusedRem.id);
        await rem?.addPowerup(TWEET_EMBED_POWERUP);
        console.log(rem, ' --- ');
      } catch (e) {
        console.error(e);
      }
      // TODO: change the rem to code block and add a sample into the text
      // await rem?.setText(SAMPLE_MERMAID);
    },
  });
}

const Text: RichTextInterface = [
  {
    i: 'm',
    code: false,
    text: 'asdasd',
  },
];
async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
