import React from 'react';
import {Composition} from 'remotion';
import {Promo, PROMO_FRAMES} from './Promo';
import {ClayStory, CLAY_FRAMES} from './ClayStory';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AirlexStory" component={Promo} durationInFrames={PROMO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ClayStory" component={ClayStory} durationInFrames={CLAY_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
