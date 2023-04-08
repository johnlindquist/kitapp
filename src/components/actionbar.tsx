/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
import { useAtomValue, useAtom, useSetAtom } from 'jotai';
import { motion } from 'framer-motion';
import { Channel, UI } from '@johnlindquist/kit/cjs/enum';
import React, { useCallback } from 'react';
import { IconButton } from './icon';
import {
  flagsAtom,
  _flag,
  _choices,
  inputAtom,
  _index,
  channelAtom,
  flagValueAtom,
  footerAtom,
  shortcutsAtom,
  uiAtom,
  sendShortcutAtom,
  enterButtonNameAtom,
  enterButtonDisabledAtom,
  appDbAtom,
  enterPressedAtom,
} from '../jotai';

type Action = {
  name: string;
  shortcut: string;
  position: 'left' | 'right';
  key: string;
  value: string;
  flag: string;
  disabled: boolean;
  arrow?: string;
};

const bg = `
bg-text-base bg-opacity-0
hover:bg-opacity-10
focus:bg-opacity-20
`;

const textContrast = `text-primary text-opacity-90`;

const transition = { duration: 0.0, ease: 'easeInOut' };

export function OptionsButton() {
  const [choices] = useAtom(_choices);
  const [input] = useAtom(inputAtom);
  const [index] = useAtom(_index);
  const [channel] = useAtom(channelAtom);
  const [flagValue, setFlagValue] = useAtom(flagValueAtom);

  const onClick = useCallback(() => {
    if (flagValue) {
      setFlagValue('');
      channel(Channel.FORWARD);
    } else {
      setFlagValue(choices.length ? choices[index].value : input);
      channel(Channel.BACK);
    }
  }, [choices, input, index, channel, flagValue, setFlagValue]);

  return (
    <motion.button
      type="button"
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1] }}
      transition={transition}
      className={`
  flex flex-row items-center justify-center
  outline-none py-0.5 px-1
  font-medium
  text-sm
  ${textContrast}

  ${bg}

  rounded
  transition-all duration-200 ease-in-out
  `}
      onClick={onClick}
    >
      <div className="px-0.5 mr-0.5">{flagValue ? 'Back' : 'Actions'}</div>
      <div className=" flex flex-row">
        <div
          className="
          py-.5 px-1 mx-0.5

          rounded
          bg-secondary/60
          hover:border-opacity-10
          "
        >
          {flagValue ? '←' : '→'}
        </div>
      </div>
    </motion.button>
  );
}

export function ActionSeparator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1] }}
      transition={transition}
      className="
      flex items-center justify-center
      font-mono
      leading-none
      text-sm font-medium
      text-primary  text-opacity-10
      bg-opacity-0
      p-0.5
      text-center
"
    >
      |
    </motion.div>
  );
}

export const formatShortcut = (shortcut = '') => {
  return shortcut
    .replace('cmd', '⌘')
    .replace('ctrl', '⌃')
    .replace('shift', '⇧')
    .replace('alt', '⌥')
    .replace('enter', '⏎')
    .replace('return', '⏎')
    .replace('escape', '⎋')
    .replace('up', '↑')
    .replace('down', '↓')
    .replace('left', '←')
    .replace('right', '→')
    .replace('delete', '⌫')
    .replace('backspace', '⌫')

    .toUpperCase();
};

export function EnterButton(action: Action) {
  const ui = useAtomValue(uiAtom);
  const sendShortcut = useSetAtom(sendShortcutAtom);
  const pressEnter = useSetAtom(enterPressedAtom);
  const setFlag = useSetAtom(_flag);

  const onClick = useCallback(
    (event) => {
      if ([UI.mic, UI.webcam].includes(ui)) {
        pressEnter();
        return;
      }
      if (ui === UI.form) {
        event.preventDefault();

        const el = document.querySelector(
          `[name="${action.name.toLowerCase()}"]`
        ) as HTMLInputElement;

        if (el) {
          el.click();
        }
      } else {
        if (action?.flag) setFlag(action.flag);
        sendShortcut(action.value);
      }
    },
    [
      ui,
      pressEnter,
      action.name,
      action.flag,
      action.value,
      setFlag,
      sendShortcut,
    ]
  );

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1] }}
      transition={transition}
      disabled={action?.disabled}
      tabIndex={action?.value === 'enter' ? 0 : -1}
      className={`
  flex flex-row items-center justify-center
  outline-none
  py-0.5 px-1.5
  font-medium
  text-sm

  rounded

  h-full
  transition-all duration-200 ease-in-out
  ${action?.disabled ? `text-primary text-opacity-25` : `${bg} ${textContrast}`}
  `}
      onClick={onClick}
    >
      <div
        className={`px-2px truncate min-w-0 mr-0.5
      `}
      >
        {action.name}
      </div>

      <div className=" flex flex-row">
        {action.shortcut.split('+').map((k) => {
          return (
            <div
              key={k}
              className={`
              flex items-center justify-center
          w-5 h-5 ml-0.5
          leading-none

          rounded
          bg-secondary bg-opacity-10
          hover:border-opacity-10

          `}
            >
              {k}
            </div>
          );
        })}
      </div>
    </motion.button>
  );
}

export function ActionButton(action: Action) {
  const ui = useAtomValue(uiAtom);
  const sendShortcut = useSetAtom(sendShortcutAtom);
  const setFlag = useSetAtom(_flag);

  const onClick = useCallback(
    (event) => {
      if (ui === UI.form) {
        event.preventDefault();

        const el = document.querySelector(
          `[name="${action.name.toLowerCase()}"]`
        ) as HTMLInputElement;

        if (el) {
          el.click();
        }
      } else {
        if (action?.flag) setFlag(action.flag);
        sendShortcut(action.value);
      }
    },
    [ui, action, setFlag, sendShortcut]
  );

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1] }}
      transition={transition}
      disabled={action?.disabled}
      tabIndex={action?.value === 'enter' ? 0 : -1}
      className={`
  flex flex-row items-center justify-center
  outline-none
  py-0.5 px-1.5
  font-medium
  text-sm

  rounded

  h-full
  transition-all duration-200 ease-in-out
  ${action?.disabled ? `text-primary text-opacity-25` : `${bg} ${textContrast}`}
  `}
      onClick={onClick}
    >
      <div
        className={`px-2px truncate min-w-0 mr-0.5
      `}
      >
        {action.name}
      </div>

      <div className=" flex flex-row">
        {action.shortcut.split('+').map((k) => {
          return (
            <div
              key={k}
              className={`
              flex items-center justify-center
          w-5 h-5 ml-0.5
          leading-none

          rounded
          bg-secondary bg-opacity-10
          hover:border-opacity-10

          `}
            >
              {k}
            </div>
          );
        })}
      </div>
    </motion.button>
  );
}

export default function ActionBar() {
  const [flags] = useAtom(flagsAtom);
  const [footer] = useAtom(footerAtom);
  const [shortcuts] = useAtom(shortcutsAtom);

  const [enterButtonName] = useAtom(enterButtonNameAtom);
  const [disabled] = useAtom(flagValueAtom);
  const [enterButtonDisabled] = useAtom(enterButtonDisabledAtom);
  const [ui] = useAtom(uiAtom);
  const [appDb] = useAtom(appDbAtom);

  const actions: Action[] = Object.entries(flags)
    .filter(([_, flag]) => {
      return flag?.bar && flag?.shortcut;
    })
    .map(([key, flag]) => {
      const action = {
        key,
        value: key,
        name: flag?.name,
        shortcut: formatShortcut(flag?.shortcut),
        position: flag.bar,
        arrow: (flag as Action)?.arrow,
        flag: key,
        disabled: Boolean(disabled),
      } as Action;

      return action;
    })
    .concat(
      shortcuts
        .filter((s) => s?.bar)
        .map(({ key, name, bar, flag }) => {
          return {
            key,
            name,
            value: key,
            shortcut: formatShortcut(key),
            position: bar,
            flag,
            disabled: Boolean(disabled),
          } as Action;
        })
    );

  const hasFlags = Object.keys(flags)?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1] }}
      transition={transition}
      className={`
      flex flex-row
      ${
        ui === UI.splash
          ? ``
          : `border-t
          border-secondary border-opacity-75`
      }
      bg-secondary
    ${
      ui === UI.splash
        ? `
    bg-opacity-0
    `
        : `
        bg-opacity-60
    `
    }

    px-4
    justify-center items-center
    overflow-hidden
    h-7 max-h-7`}
    >
      <IconButton />

      <div className="left-container flex flex-row justify-center items-center pb-px">
        {actions
          .filter((action) => action.position === 'left' && !appDb?.mini)
          .flatMap((action, i, array) => [
            // eslint-disable-next-line react/jsx-key
            <ActionButton {...action} />,
            i < array.length - 1 ? (
              <ActionSeparator key={`${action?.key}-separator`} />
            ) : null,
            i === array.length - 1 && footer?.length ? (
              <ActionSeparator key={`${action?.key}-separator`} />
            ) : null,
          ])}
      </div>
      {footer?.length ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1] }}
          transition={transition}
          className={`flex flex-1 max-h-full h-full
        px-2
        items-center justify-left
text-sm font-medium
${textContrast}
text-opacity-75
truncate
      `}
        >
          <div
            className="truncate min-w-0 pb-px"
            dangerouslySetInnerHTML={{ __html: footer }}
          />
        </motion.div>
      ) : (
        <div className="flex-1 max-h-full" />
      )}

      <div
        className={`
      ${appDb?.mini ? `w-full justify-between` : `justify-center`}
      right-container flex flex-row items-center pb-px overflow-hidden`}
      >
        <div className="options-container flex flex-row">
          {hasFlags && [
            <OptionsButton key="options-button" />,
            <ActionSeparator key="options-separator" />,
          ]}
        </div>
        <div className="flex flex-row flex-grow-0 items-center overflow-hidden">
          {actions
            .filter((action) => action.position === 'right' && !appDb?.mini)
            .flatMap((action, i, array) => [
              // eslint-disable-next-line react/jsx-key
              <ActionButton {...action} />,
              // eslint-disable-next-line no-nested-ternary
              i < array.length - 1 ? (
                <ActionSeparator key={`${action?.key}-separator`} />
              ) : enterButtonName ? (
                <ActionSeparator key={`${action?.key}-separator`} />
              ) : null,
            ])}
        </div>
        <div className="enter-container flex flex-row min-w-fit items-center">
          {enterButtonName ? (
            <EnterButton
              key="enter-button"
              name={enterButtonName}
              position="right"
              shortcut="⏎"
              value="enter"
              flag=""
              disabled={enterButtonDisabled}
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
