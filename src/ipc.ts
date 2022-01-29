/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */
import { ipcMain } from 'electron';
import log from 'electron-log';
import path from 'path';
import { debounce } from 'lodash';
import { Script } from '@johnlindquist/kit';
import { Channel } from '@johnlindquist/kit/cjs/enum';
import {
  kitPath,
  getLogFromScriptPath,
  tmpDownloadsDir,
  mainScriptPath,
  isInDir,
  kenvPath,
  isFile,
} from '@johnlindquist/kit/cjs/utils';
import { ProcessInfo } from '@johnlindquist/kit/types/core';
import { AppMessage, AppState } from '@johnlindquist/kit/types/kitapp';
import { existsSync, renameSync } from 'fs';
import { writeFile } from 'fs/promises';
import isImage from 'is-image';
import { DownloaderHelper } from 'node-downloader-helper';
import detect from 'detect-file-type';
import { emitter, KitEvent } from './events';
import { processes } from './process';

import { endPrompt, focusPrompt, reload, resize } from './prompt';
import { runPromptProcess, runScript } from './kit';
import { AppChannel } from './enums';
import { ResizeData, Survey } from './types';
import { getAssetPath } from './assets';
import { state, updateScripts } from './state';

const handleChannel =
  (fn: (processInfo: ProcessInfo, message: AppMessage) => void) =>
  (_event: any, message: AppMessage) => {
    // log.info(message);
    const processInfo = processes.getByPid(message?.pid);

    if (message?.channel !== Channel.INPUT) {
      log.info(
        `${processInfo?.pid}: ✉️  ${message?.channel}: ${path.basename(
          processInfo?.scriptPath || ''
        )}`
      );
    }

    if (processInfo) {
      fn(processInfo, message);
    } else {
      log.warn(`${message.channel} failed on ${message?.pid}`);
      // log.warn(processInfo?.child, processInfo?.type);
      // console.log(message);
    }
  };

export const startIpc = () => {
  ipcMain.on(
    Channel.PROMPT_ERROR,
    debounce((_event, { error }) => {
      log.warn(error);
      if (!state.hidden) {
        setTimeout(() => {
          reload();
          // processes.add(ProcessType.App, kitPath('cli/kit-log.js'), []);
          // escapePromptWindow();
        }, 3000);
      }
    }, 1000)
  );

  ipcMain.on(AppChannel.RESIZE, (event, resizeData: ResizeData) => {
    resize(resizeData);
  });

  ipcMain.on(
    AppChannel.END_PROCESS,
    async (event, { pid, script }: { pid: number; script: Script }) => {
      // console.log('␛ ESCAPE_PRESSED', { pid, script });
      processes.removeByPid(pid);
      emitter.emit(KitEvent.ResumeShortcuts);

      endPrompt(script.filePath);
    }
  );

  ipcMain.on(
    AppChannel.OPEN_SCRIPT_LOG,
    async (event, { script }: AppState) => {
      const logPath = getLogFromScriptPath((script as Script).filePath);
      await runPromptProcess(kitPath('cli/edit-file.js'), [logPath]);
    }
  );

  ipcMain.on(
    AppChannel.OPEN_SCRIPT_DB,
    async (event, { focused, script }: AppState) => {
      const filePath = (focused as any)?.filePath || script?.filePath;
      const dbPath = path.resolve(
        filePath,
        '..',
        '..',
        'db',
        `_${path.basename(filePath).replace(/js$/, 'json')}`
      );
      await runPromptProcess(kitPath('cli/edit-file.js'), [dbPath]);
    }
  );

  ipcMain.on(
    AppChannel.OPEN_SCRIPT,
    async (event, { script, description, input }: Required<AppState>) => {
      // When the editor is editing a script. Toggle back to running the script.
      const descriptionIsFile = await isFile(description);
      const descriptionIsInKenv = isInDir(kenvPath())(description);

      if (descriptionIsInKenv && descriptionIsFile) {
        try {
          await writeFile(description, input);
          await updateScripts();
          await runPromptProcess(description, []);
        } catch (error) {
          log.error(error);
        }
        return;
      }

      const isInKit = isInDir(kitPath())(script.filePath);

      if (script.filePath && isInKit) return;

      await runPromptProcess(kitPath('cli/edit-file.js'), [script.filePath]);
    }
  );

  ipcMain.on(
    AppChannel.EDIT_SCRIPT,
    async (event, { script }: Required<AppState>) => {
      if ((isInDir(kitPath()), script.filePath)) return;
      await runPromptProcess(kitPath('main/edit.js'), [script.filePath]);
    }
  );

  ipcMain.on(
    AppChannel.OPEN_FILE,
    async (event, { script, focused }: Required<AppState>) => {
      const filePath = (focused as any)?.filePath || script?.filePath;

      await runPromptProcess(kitPath('cli/edit-file.js'), [filePath]);
    }
  );

  ipcMain.on(AppChannel.RUN_MAIN_SCRIPT, async () => {
    runPromptProcess(mainScriptPath);
  });

  ipcMain.on(AppChannel.RUN_PROCESSES_SCRIPT, async () => {
    runPromptProcess(kitPath('cli', 'processes.js'));
  });

  ipcMain.on(AppChannel.FOCUS_PROMPT, () => {
    focusPrompt();
  });

  for (const channel of [
    Channel.INPUT,
    Channel.CHOICE_FOCUSED,
    Channel.CHOICES,
    Channel.NO_CHOICES,
    Channel.BACK,
    Channel.FORWARD,
    Channel.UP,
    Channel.DOWN,
    Channel.LEFT,
    Channel.RIGHT,
    Channel.TAB,
    Channel.ESCAPE,
    Channel.VALUE_SUBMITTED,
    Channel.TAB_CHANGED,
    Channel.BLUR,
    Channel.ABANDON,
    Channel.GET_EDITOR_HISTORY,
  ]) {
    // log.info(`😅 Registering ${channel}`);
    ipcMain.on(
      channel,
      handleChannel(({ child }, message) => {
        // log.info({ channel, message });
        if ([Channel.VALUE_SUBMITTED, Channel.TAB_CHANGED].includes(channel)) {
          emitter.emit(KitEvent.ResumeShortcuts);
        }

        if (channel === Channel.VALUE_SUBMITTED) {
          state.ignoreBlur = false;
        }

        if (child) {
          child?.send(message);
        }
      })
    );
  }
  // ipcMain.on(
  //   Channel.SET_PREVIEW_ENABLED,
  //   async (event, previewEnabled: boolean) => {
  //     setPreviewEnabled(previewEnabled);
  //   }
  // );

  ipcMain.on(
    AppChannel.DRAG_FILE_PATH,
    async (event, { filePath, icon }: { filePath: string; icon: string }) => {
      try {
        let newPath = filePath;
        if (filePath.startsWith('http')) {
          newPath = await new Promise((resolve, reject) => {
            const dl = new DownloaderHelper(filePath, tmpDownloadsDir, {
              override: true,
            });
            dl.on('end', (info) => {
              const fp = info.filePath;
              detect.fromFile(
                fp,
                (err: any, result: { ext: string; mime: string }) => {
                  if (err) {
                    throw err;
                  }
                  if (!fp.endsWith(result.ext)) {
                    const fixedFilePath = `${fp}.${result.ext}`;
                    renameSync(fp, fixedFilePath);
                    resolve(fixedFilePath);
                  } else {
                    resolve(fp);
                  }
                }
              );
            });
            dl.start();
          });
        }

        if (existsSync(newPath)) {
          const pickIcon = isImage(newPath)
            ? newPath.endsWith('.gif') || newPath.endsWith('.svg')
              ? getAssetPath('icons8-image-file-24.png')
              : newPath
            : getAssetPath('icons8-file-48.png');
          event.sender.startDrag({
            file: newPath,
            icon: pickIcon,
          });
        }
      } catch (error) {
        log.warn(error);
      }
    }
  );

  ipcMain.on(AppChannel.FEEDBACK, (event, data: Survey) => {
    runScript(kitPath('cli', 'feedback.js'), JSON.stringify(data));
  });

  // emitter.on(KitEvent.Blur, async () => {
  //   const promptProcessInfo = await processes.findPromptProcess();

  //   if (promptProcessInfo && promptProcessInfo.scriptPath) {
  //     const { child, scriptPath } = promptProcessInfo;
  //     emitter.emit(KitEvent.ResumeShortcuts);

  //     if (child) {
  //       log.info(`🙈 Blur process: ${scriptPath} id: ${child.pid}`);
  //       child?.send({ channel: Channel.PROMPT_BLURRED });
  //     }
  //   }

  //   setPromptState({
  //     hidden: false,
  //   });

  //   sendToPrompt(Channel.PROMPT_BLURRED);
  // });
};
