import {
  windowNames,
  tftClassId,
  tftQueueIds,
  lobbyInterestingFeatures,
  interestingFeatures,
} from '../../consts';
import { OWGames } from '../../odk-ts/ow-games';
import { OWGamesEvents } from '../../odk-ts/ow-games-events';
import { OWGameListener } from '../../odk-ts/ow-game-listener';
import { OWWindow } from '../../odk-ts/ow-window';
import RunningGameInfo = overwolf.games.RunningGameInfo;
import { IGame, IStage } from '../../tft-ts';

class Launcher {
  private static _instance: Launcher;
  private _launcherEventsListener;

  private constructor() {
    this._launcherEventsListener = new OWGamesEvents(
      {
        onInfoUpdates: this.onInfoUpdates.bind(this),
        onNewEvents: this.onNewEvents.bind(this),
      },
      lobbyInterestingFeatures
    );
  }

  private onInfoUpdates(info) {
    console.log('Info UPDATE: ' + JSON.stringify(info));
  }

  private onNewEvents(info) {
    console.log('EVENT FIRED: ' + JSON.stringify(info));
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new Launcher();
    }

    return this._instance;
  }

  public run() {
    this._launcherEventsListener.start();
  }

  // private async isTFTQueue(): Promise<boolean> {
  //   const info = await OWGames.getRunningGameInfo();

  //   return info && info.isRunning && this.isGameTFT(info);
  // }

  // Identify whether the RunningGameInfo object we have references TFT
  // private isQueueTFT(info: RunningGameInfo) {
  //   return tftQueueIds.includes(info.classId);
  // }
}
// The background controller holds all of the app's background logic - hence its name. it has
// many possible use cases, for example sharing data between windows, or, in our case,
// managing which window is currently presented to the user. To that end, it holds a dictionary
// of the windows available in the app.
// Our background controller implements the Singleton design pattern, since only one
// instance of it should exist.
class BackgroundController {
  private static _instance: BackgroundController;
  private _windows = {};
  private _tftGameListener: OWGameListener;
  private _tftGameEventsListener: OWGamesEvents;

  protected game: IGame;
  protected isStageInProgress: boolean = false;
  protected startedGame: boolean = false;

  private constructor() {
    this.game = {
      game_info: {},
      summoner_name: '',
      stages: [],
    };
    // Populating the background controller's window dictionary
    this._windows[windowNames.desktop] = new OWWindow(windowNames.desktop);
    this._windows[windowNames.inGame] = new OWWindow(windowNames.inGame);

    // When a TFT game is started or is ended, toggle the app's windows
    // this._launcher = launcher;
    this._tftGameListener = new OWGameListener({
      onGameStarted: this.onGameStarted.bind(this),
      onGameEnded: this.onGameEnded.bind(this),
    });

    this._tftGameEventsListener = new OWGamesEvents(
      {
        onInfoUpdates: this.onInfoUpdates.bind(this),
        onNewEvents: this.onNewEvents.bind(this),
      },
      interestingFeatures
    );
  }

  // Implementing the Singleton design pattern
  public static instance(): BackgroundController {
    if (!BackgroundController._instance) {
      BackgroundController._instance = new BackgroundController();
    }

    return BackgroundController._instance;
  }

  // When running the app, start listening to games' status and decide which window should
  // be launched first, based on whether TFT is currently running
  public async run() {
    this._tftGameListener.start();
  }

  private onInfoUpdates(info) {
    this.recordInfoUpdate(info);
  }

  private onNewEvents(e) {
    console.log('EVENT:', e);
    // this.logLine(this._eventsLog, e);
  }

  private onGameEnded(info) {
    if (!info || !this.isGameTFT(info)) {
      return;
    }

    if (!info.isRunning) {
      console.log('GAME OVER', info, this.game);
    }
  }

  private onGameStarted(info) {
    if (!info || !this.isGameTFT(info)) {
      return;
    }

    if (info.isRunning) {
      if (!this.startedGame) {
        console.log('STARTING GAME', info);
        this._tftGameEventsListener.start();
        this.startedGame = true;
      }
    }
  }

  private async isTFTRunning(): Promise<boolean> {
    overwolf.games.launchers.getRunningLaunchersInfo((info) =>
      console.log('is TFT running', info)
    );

    const info = await OWGames.getRunningGameInfo();
    console.log('info 2', info);

    return info && info.isRunning && this.isGameTFT(info);
  }

  // Identify whether the RunningGameInfo object we have references TFT
  private isGameTFT(info: RunningGameInfo) {
    return info.classId === tftClassId;
  }

  private recordInfoUpdate(data) {
    try {
      // TODO remove log latest stage at end
      const currentStageIdx =
        this.game.stages.length - 1 > -1 ? this.game.stages.length - 1 : 0;

      if ('game_info' in data) {
        this.game.game_info.mode = data.game_info.gameMode;
        this.game.game_info.match_id = data.game_info.matchId;
      }

      if ('me' in data && 'summoner_name' in data.me) {
        this.game.summoner_name = data.me.summoner_name;
      }

      if ('match_info' in data && 'round_type' in data.match_info) {
        const { stage, name } = JSON.parse(
          data.match_info.round_type.replace(/\\/g, '')
        );
        const newStage: IStage = {
          stage,
          type: name,
          health: this.game.stages[currentStageIdx]?.health || 100,
        };
        this.game.stages.push(newStage);
      }

      if ('me' in data && 'xp' in data.me) {
        const { current_xp } = JSON.parse(data.me.xp.replace(/\\/g, ''));
        if (
          !this.isStageInProgress &&
          !('xp' in this.game.stages[currentStageIdx])
        ) {
          this.game.stages[currentStageIdx]['xp'] = {
            before: current_xp,
          };
        }
        if ('xp' in this.game.stages[currentStageIdx]) {
          this.game.stages[currentStageIdx]['xp']['after'] = current_xp;
        }
      }

      if ('me' in data && 'gold' in data.me) {
        const { gold } = data.me;
        if (
          !this.isStageInProgress &&
          !('gold' in this.game.stages[currentStageIdx])
        ) {
          this.game.stages[currentStageIdx]['gold'] = {
            before: gold,
          };
        }

        if ('gold' in this.game.stages[currentStageIdx]) {
          this.game.stages[currentStageIdx]['gold']['after'] = gold;
        }
      }

      if ('me' in data && 'health' in data.me) {
        const { health } = data.me;
        this.game.stages[currentStageIdx]['health'] = health;
      }

      if ('match_info' in data && 'battle_state' in data.match_info) {
        this.isStageInProgress = data.match_info.match_state;
      }

      if ('match_info' in data && 'round_outcome' in data.match_info) {
        for (const player in data.match_info.round_outcome) {
          this.game.stages[currentStageIdx]['didWin'] =
            player === this.game.summoner_name &&
            data.match_info.round_outcome[player].outcome === 'victory';
        }
      }

      if ('board' in data && !this.isStageInProgress) {
        const board = [];
        const boardPiecesData = JSON.parse(
          data.board.board_pieces.replace(/\\/g, '')
        );
        for (const cell in boardPiecesData) {
          const piece = {
            position: cell,
            unit: boardPiecesData[cell].name,
            level: boardPiecesData[cell].level,
            items: [
              boardPiecesData[cell].item_1,
              boardPiecesData[cell].item_2,
              boardPiecesData[cell].item_3,
            ].filter((item) => !!item),
          };
          board.push(piece);
        }
        this.game.stages[currentStageIdx].board = board;
        console.log(board);
      }
    } catch (err) {
      console.log(err);
    }
    // data.game_info.gameMode, data.game_info.matchId
    // NOT NEEDED FOR NOW live_client_data??
    // V2 - roster.player_status.[player_name] (.health, .xp)  - break down into an iterable array
    // me.summoner_name, me.rank, me.health?
    // match_info.battle_state.in_progress

    // match_info.round_outcome
    // once match in progress, save the last board and bench state

    // match.info.round_type should signify a new stage
  }
}

BackgroundController.instance().run();
