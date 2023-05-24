export enum AppChannel {
  BUILD_TS_SCRIPT = 'BUILD_TS_SCRIPT',
  DRAG_FILE_PATH = 'DRAG_FILE_PATH',
  EDIT_SCRIPT = 'EDIT_SCRIPT',
  FOCUS_PROMPT = 'FOCUS_PROMPT',
  GET_ASSET = 'GET_ASSET',
  INIT_RESIZE_HEIGHT = 'INIT_RESIZE_HEIGHT',
  OPEN_FILE = 'OPEN_FILE',
  OPEN_SCRIPT = 'OPEN_SCRIPT',
  OPEN_SCRIPT_DB = 'OPEN_SCRIPT_DB',
  OPEN_SCRIPT_LOG = 'OPEN_SCRIPT_LOG',
  PROMPT_HEIGHT_RESET = 'PROMPT_HEIGHT_RESET',
  READ_FILE_CONTENTS = 'READ_FILE_CONTENTS',
  RECEIVE_FILE_CONTENTS = 'RECEIVE_FILE_CONTENTS',
  RESIZE = 'RESIZE',
  RUN_MAIN_SCRIPT = 'RUN_MAIN_SCRIPT',
  SET_FILEPATH_BOUNDS = 'SET_PROMPT_DB',
  SET_MAIN_HEIGHT = 'SET_MAIN_HEIGHT',
  END_PROCESS = 'END_PROCESS',
  FEEDBACK = 'SUBMIT_SURVEY',
  PROCESSES = 'PROCESSES',
  RUN_PROCESSES_SCRIPT = 'RUN_PROCESSES_SCRIPT',
  LOG = 'LOG',
  MAIN_SCRIPT = 'MAIN_SCRIPT',
  KIT_STATE = 'STATE',
  APPLY_UPDATE = 'APPLY_UPDATE',
  LOGIN = 'LOGIN',
  USER_CHANGED = 'USER_CHANGED',
  TERM_RESIZE = 'TERM_RESIZE',
  TERM_READY = 'TERM_READY',
  TERM_INPUT = 'TERM_INPUT',
  TERM_OUTPUT = 'TERM_OUTPUT',
  TERM_EXIT = 'TERM_EXIT',
  CSS_VARIABLE = 'CSS_VARIABLE',
  TERM_ATTACHED = 'TERM_ATTACHED',
  SET_TERM_CONFIG = 'SET_TERM_CONFIG',
  SET_MIC_CONFIG = 'SET_MIC_CONFIG',
  ZOOM = 'ZOOM',
  TERM_KILL = 'TERM_KILL',
  AUDIO_DATA = 'AUDIO_DATA',
  TAKE_SELFIE = 'TAKE_SELFIE',
  SET_WEBCAM_ID = 'SET_WEBCAM_ID',
  SET_MIC_ID = 'SET_MIC_ID',
  RELOAD = 'RELOAD',
  ERROR_RELOAD = 'ERROR_RELOAD',
  ENABLE_BACKGROUND_THROTTLING = 'ENABLE_BACKGROUND_THROTTLING',
  SET_BOUNDS = 'SET_BOUNDS',
  HIDE = 'HIDE',
  SHOW = 'SHOW',
  PRE_SHOW = 'PRE_SHOW',
  PTY_READY = 'PTY_READY',
  PROMPT_UNLOAD = 'PROMPT_UNLOAD',
}

export enum WindowChannel {
  SET_LAST_LOG_LINE = 'LOG_LINE',
  SET_EDITOR_LOG_MODE = 'SET_EDITOR_LOG_MODE',
  SET_LOG_VALUE = 'SET_LOG_VALUE',
  CLEAR_LOG = 'CLEAR_LOG',
  MOUNTED = 'MOUNTED',
}

export enum Trigger {
  App = 'app',
  Background = 'background',
  Info = 'info',
  Schedule = 'schedule',
  Snippet = 'snippet',
  System = 'system',
  Shortcut = 'shortcut',
  Watch = 'watch',
  Kit = 'kit',
  Kar = 'kar',
  Menu = 'menu',
  Tray = 'tray',
  RunTxt = 'runTxt',
  Protocol = 'Protocol',
}

export enum HideReason {
  MainShortcut = 'MainShortcut',
}
