import { AppWindow } from '../AppWindow';
import { OWGamesEvents } from '../../odk-ts/ow-games-events';
import { OWHotkeys } from '../../odk-ts/ow-hotkeys';
import { interestingFeatures, hotkeys, windowNames } from '../../consts';
import WindowState = overwolf.windows.WindowStateEx;

// The window displayed in-game while a TFT game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
  private static _instance: InGame;
  private _tftGameEventsListener: OWGamesEvents;
  private _eventsLog: HTMLElement;
  private _infoLog: HTMLElement;

  private constructor() {
    super(windowNames.inGame);

    this.data = {};

    this._eventsLog = document.getElementById('eventsLog');
    this._infoLog = document.getElementById('infoLog');

    this.setToggleHotkeyBehavior();
    this.setToggleHotkeyText();

    this._tftGameEventsListener = new OWGamesEvents(
      {
        onInfoUpdates: this.onInfoUpdates.bind(this),
        onNewEvents: this.onNewEvents.bind(this),
      },
      interestingFeatures
    );
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  public run() {
    this._tftGameEventsListener.start();
  }

  private onInfoUpdates(info) {
    this.logLine(this._infoLog, info);
  }

  // Special events will be highlighted in the event log
  private onNewEvents(e) {
    this.logLine(this._eventsLog, e);
  }

  // Displays the toggle minimize/restore hotkey in the window header
  private async setToggleHotkeyText() {
    const hotkeyText = await OWHotkeys.getHotkeyText(hotkeys.toggle);
    const hotkeyElem = document.getElementById('hotkey');
    hotkeyElem.textContent = hotkeyText;
  }

  // Sets toggleInGameWindow as the behavior for the Ctrl+F hotkey
  private async setToggleHotkeyBehavior() {
    const toggleInGameWindow = async (hotkeyResult) => {
      console.log(`pressed hotkey for ${hotkeyResult.featureId}`);
      const inGameState = await this.getWindowState();

      if (
        inGameState.window_state === WindowState.NORMAL ||
        inGameState.window_state === WindowState.MAXIMIZED
      ) {
        this.currWindow.minimize();
      } else if (
        inGameState.window_state === WindowState.MINIMIZED ||
        inGameState.window_state === WindowState.CLOSED
      ) {
        this.currWindow.restore();
      }
    };

    OWHotkeys.onHotkeyDown(hotkeys.toggle, toggleInGameWindow);
  }

  // Appends a new line to the specified log
  private logLine(log: HTMLElement, data) {
    // sample data structure
    /*
    { 
      game_info: {
        mode: 'custom' | 'normal' | 'ranked',
        match_id: 'somematchid',
      },
      summoner_name: 'Pidjhin',
      stages: [
        {
          stage: '1-1',
          type: 'PVE' | 'PVP',
          health: {
            before: 100,
            after: 99,
          },
          gold: {
            before: 0,
            after: 6,
          }
          xp: {
            level: 1,
            current_xp: 0,
            xp_max: 2,
          },
          board: [
            {
              position: 'cell_25',
              unit: 'TFT4_Vayne',
              level: 1,
              items: [
                'Icon_NeedlesslyLargeRod'
              ]
            }
          ]
        }

      ]
    }
    */

    // counter? stage currently at, in_progress
    console.log(`${log.id}:`);
    console.log(data);
    // data.game_info.gameMode, data.game_info.matchId
    // NOT NEEDED FOR NOW live_client_data??
    // V2 - roster.player_status.[player_name] (.health, .xp)  - break down into an iterable array
    // me.summoner_name, me.rank, me.health?
    // match_info.battle_state.in_progress

    // match_info.round_outcome
    // once match in progress, save the last board and bench state

    // match.info.round_type should signify a new stage
    const line = document.createElement('pre');
    line.textContent = JSON.stringify(data);

    const shouldAutoScroll =
      log.scrollTop + log.offsetHeight > log.scrollHeight - 10;

    log.appendChild(line);

    if (shouldAutoScroll) {
      log.scrollTop = log.scrollHeight;
    }
  }
}

InGame.instance().run();
