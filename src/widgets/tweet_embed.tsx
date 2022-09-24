import {
  usePlugin,
  renderWidget,
  useTracker,
  useRunAsync,
  useAPIEventListener,
  AppEvents,
} from '@remnote/plugin-sdk';
import { useEffect, useRef, useState } from 'react';
import { TWEET_EMBED_POWERUP } from '.';

const twitterWidgetJs = 'https://platform.twitter.com/widgets.js';

declare global {
  interface Window {
    twttr: any;
  }
}

interface JSONObject {
  [k: string]: any;
}

export interface TwitterTweetEmbedProps {
  /**
   * Tweet id that needs to be shown
   */
  tweetId: string;
  /**
   * Additional options to pass to twitter widget plugin
   */
  options?: JSONObject;
  /**
   * Placeholder while tweet is loading
   */
  placeholder?: string | React.ReactNode;
  /**
   * Function to execute after load, return html element
   */
  onLoad?: (element: any) => void;
}

const methodName = 'createTweet';

function useIsMounted() {
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
}

function Loading() {
  return (
    <div role="status">
      <svg
        aria-hidden="true"
        className="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        ></path>
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        ></path>
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
function TweetEmbedDOM(props: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(true);
  const isMounted = useIsMounted();
  useRunAsync(async () => {
    // setTweetUrl(url)
    const script = require('@rstacruz/scriptjs/script');
    console.log('dom render ---- ', props.url);
    script(twitterWidgetJs, 'twitter-embed', () => {
      if (!window.twttr) {
        console.error('Failure to load window.twttr, aborting load');
        return;
      }

      if (isMounted.current) {
        if (!window.twttr.widgets[methodName]) {
          console.error(`Method ${methodName} is not present anymore in twttr.widget api`);
          return;
        }
        console.log(props, '=  ', ref.current);
        window.twttr.widgets[methodName](props.url.split('/').pop(), ref?.current).then(
          (element: any) => {
            setLoading(false);
          }
        );
      }
    });
  }, [props.url]);
  return (
    <div className={`flex flex-row items-start`}>
      {loading ? <Loading /> : null}
      <div
        className="flex-1"
        style={{
          maxWidth: 550,
          height: loading ? 0 : opened ? 417 : 50,
        }}
        ref={ref}
      />
      {loading ? null : (
        <input type={'checkbox'} checked={opened} onChange={() => setOpened(!opened)} />
      )}
    </div>
  );
}

const tweetMap = {};

function TweetEmbed() {
  const plugin = usePlugin();
  const [tweetUrl, setTweetUrl] = useState('');
  const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext(), []);
  const remId = ctx?.remId;
  const widgetId = ctx?.widgetInstanceId;
  useTracker(async (reactivePlugin) => {
    const rem = await reactivePlugin.rem.findOne(remId);
    console.log('changed - ', rem);
    checkTweet(rem?._id);
  }, []);

  // useRunAsync(async () => {
  //   checkTweet(remId);
  // }, [remId]);
  const checkTweet = async (remId?: string) => {
    if (!remId) {
      return;
    }
    const rem = await plugin.rem.findOne(remId);
    const qRems = rem?.text.filter((item) => typeof item === 'object' && item.i === 'q');
    // @ts-ignore
    const tweets = await plugin.rem.findMany(qRems.map((item) => item._id));
    const url = tweets?.map((item) => item.text[0])[0] as string;

    console.log('--------------------', url, remId);
    if (url && !rem?.hasPowerup(TWEET_EMBED_POWERUP)) {
      // rem?.addPowerup(TWEET_EMBED_POWERUP);
    } else {
      // rem?.setPowerupProperty()
    }
    setTweetUrl(url);
  };

  useAPIEventListener(AppEvents.RemChanged, remId + '', (rem) => {
    console.log(rem, ' --- render ', remId);
    checkTweet(remId);
  });

  useEffect(() => {
    checkTweet(remId);
  }, [remId]);

  console.log(tweetUrl, ' = = = ==')
  return <div>
    <h1>qwe</h1>
    {tweetUrl ? <TweetEmbedDOM url={tweetUrl} /> : null}</div>;
}

renderWidget(TweetEmbed);
