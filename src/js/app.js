import interact from 'interactjs';
import BRICK_LAYOUTS from './bricks';

const MAX_BRICK_WIDTH = 6;

const addClass = (el, cl) => {
  el.className += ' ' + cl;
};

const removeClass = (el, cl) => {
  el.className = el.className.split(' ').filter(c => c !== cl).join(' ');
};

const createEmptyState = () => '000000000000000000000000000000000000000000000000000000000000000000000000000000000'.split('').map(Number);

const getStateWithBrickLayoutAtPos = (layout = [], x, y) => {
  let state = createEmptyState();
  if (x < 0 || x + layout[0].length > 9 || y < 0 || y + layout.length > 9) {
    return state;
  }
  layout.forEach((row, i) => {
    const index = ((y + i) * 9) + x;
    state.splice(index, row.length, ...row);
  });
  return state;
}

const combineState = (a, b) => a.map((s, i) => s + b[i]);

const printState = state => {
  let str = '';
  for (let i=0; i<9; i++) {
    str += state.slice(i * 9, i * 9 + 9).join(' ') + '\n';
  }
  console.log(str);
}

const printLayout = layout => {
  layout.forEach(row => console.log(row.join('')));
};

const getWinsInState = state => {
  let result = createEmptyState();
  let wins = 0;

  // Check rows
  for (let i=0; i<9; i++) {
    const col = createEmptyState();
    const row = createEmptyState();
    for (let j=0; j<9; j++) {
      const colIndex = i + (j * 9);
      if (state[colIndex]) {
        col[colIndex] = 1;
      }
      const rowIndex = (i * 9) + j;
      if (state[rowIndex]) {
        row[rowIndex] = 1;
      }
    }
    if (col.filter(e => e).length === 9) {
      result = combineState(result, col);
      wins++;
    }
    if (row.filter(e => e).length === 9) {
      result = combineState(result, row);
      wins++;
    }
  }

  // Check boxes
  for (let i=0; i<9; i+=3) {
    for (let j=0; j<9; j+=3) {
      const box = createEmptyState();
      for (let n=0; n<3; n++) {
        for (let m=0; m<3; m++) {
          const index = i + (j * 9) + m + (n * 9);
          if (state[index]) {
            box[index] = 1;
          }
        }
      }
      if (box.filter(e => e).length === 9) {
        result = combineState(result, box);
        wins++;
      }
    }
  }
  return {
    state: result,
    wins,
  };
};

class Scoreboard {
  constructor() {
    this.score = 0;
    this.renderScore();
    if (this.highScore) {
      this.renderHighScore();
    }
  }

  addPoints(points) {
    console.log('scored', points);
    this.score += points;
    if (this.score > this.highScore) {
      window.localStorage.setItem('highscore', this.score);
    }
    this.renderScore();
  }

  renderScore() {
    document.getElementById('current-score').innerText = this.score;
  }

  renderHighScore() {
    document.getElementById('high-score').innerText = '/ ' + this.highScore;
  }

  get highScore() {
    return Number(window.localStorage.getItem('highscore')) || null;
  }
}

class Tile {
  constructor(x, y, blocked = false) {
    this.x = x;
    this.y = y;
    this._blocked = false;

    if (Math.random() < 0.2 || (x === 0 && y === 0)) {
      //this.block();
    }
    if (Math.random() < 0.2 || (x === 1 && y === 0)) {
      //this.shade();
    }
    if (blocked) {
      this.block();
    }
  }

  get node() {
    if (this._node) return this._node;
    const node = document.createElement('div');
    addClass(node, 'tile');
    const u = Math.floor(this.x / 3);
    const v = Math.floor(this.y / 3);
    if (((u === 0 || u === 2) && (v === 0 || v === 2))
      || (u === 1 && v === 1)) {
      addClass(node, 'darker');
    }
    this._node = node;
    return this._node;
  }

  reposition(width, height) {
    this.node.style.width = width + 'px';
    this.node.style.height = height + 'px';
    this.node.style.transform = `translate(${this.x * width}px, ${this.y * height}px)`;
  }

  block() {
    if (this._blocked) return;
    this._blocked = true;
    addClass(this.node, 'blocked');
    this.unshade();
  }

  unblock() {
    if (!this._blocked) return;
    this._blocked = false;
    removeClass(this.node, 'blocked');
  }

  get blocked() {
    return this._blocked;
  }

  shade() {
    addClass(this.node, 'shaded');
  }

  unshade() {
    removeClass(this.node, 'shaded');
  }

  highlight() {
    addClass(this.node, 'highlighted');
  }

  unhighlight() {
    removeClass(this.node, 'highlighted');
  }
}

class Grid {
  constructor(state) {
    if (!state) state = createEmptyState();
    this.tiles = [];

    for (let y=0; y<9; y++) {
      const slice = state.slice(y * 9, (y * 9) + 9);
      slice.forEach((el, x) => this.tiles.push(new Tile(x, y, el)));
    }
  }

  get state() {
    return this.tiles.map(tile => tile.blocked ? 1 : 0);
  }

  get node() {
    if (this._node) return this._node;
    const node = document.createElement('div');
    node.style.position = 'relative';
    addClass(node, 'grid');

    const tileContainer = document.createElement('div');
    tileContainer.style.position = 'absolute';
    tileContainer.style.width = '100%';
    tileContainer.style.height = '100%';
    tileContainer.style.display = 'grid';
    tileContainer.style.gridTemplateRows = 'repeat(9, 1fr';
    tileContainer.style.gridTemplateColumns = 'repeat(9, 1fr';
    node.appendChild(tileContainer);
    this.tiles.forEach((tile, i) => {
      const y = Math.floor(i / 9) + 1;
      const x = (i % 9) + 1;
      tile.node.style.gridRow = `${y}`;
      tile.node.style.gridColumn = `${x}`;
      tileContainer.appendChild(tile.node);
    });

    const spacer = document.createElement('div');
    spacer.style.paddingTop = '100%';
    node.appendChild(spacer);

    this._node = node;
    return this._node;
  }

  get tileWidth() {
    return this.node.getBoundingClientRect().width / 9;
  }

  get tileHeight() {
    return this.node.getBoundingClientRect().height / 9;
  }

  getTilesFromState(state) {
    return this.tiles.filter((tile, i) => state[i]);
  }

  getInternalPos(domX, domY) {
    const { x, y, width, height } = this.node.getBoundingClientRect();
    const diffX = domX - x;
    const diffY = domY - y;
    return {
      x: Math.round(diffX / (width / 9)),
      y: Math.round(diffY / (height / 9)),
    };
  }

  getTilesCoveredByLayoutAt(layout, x, y) {
    const flatBrickTiles = [];
    layout.forEach((row, i) => {
      row.forEach((col, j) => {
        if (col) {
          flatBrickTiles.push({ x: j + x, y: i + y});
        }
      });
    });

    return this.tiles.filter(tile => {
      return flatBrickTiles.find(({ x: tx, y: ty }) => tile.x === tx && tile.y === ty);
    });
  }

  isLayoutInsideBounds(layout, x, y) {
    const width = layout[0].length;
    const height = layout.length;

    // Check out of bounds
    return x >= 0 && y >= 0
      && (x + width <= 9)
      && (y + height <= 9);
  }

  canLayoutBePlacedAt(layout, x, y) {
    const insideGridBounds = this.isLayoutInsideBounds(layout, x, y);
    if (!insideGridBounds) return false;
    const coveredTiles = this.getTilesCoveredByLayoutAt(layout, x, y);
    return !coveredTiles.find(tile => tile.blocked);
  }

  destroy() {
    this.node.remove();
  }
}

class BrickHandle {
  constructor(brick, grid) {
    brick.handle = this;
    this.grid = grid;
    this.brick = brick;
    this.position = { x: 0, y: 0 };
    this.node; // Get once to create
    this._containerNode.appendChild(brick.node);
    this.toggleConstrainBrickSize(true);
    this._listeners = {};
  }

  get node() {
    if (this._node) return this._node;
    const node = document.createElement('div');
    addClass(node, 'brick-handle');
    node.style.position = 'absolute';
    node.style.width = '150px';
    node.style.height = '150px';
    node.style.top = 0;
    node.style.left = 0;
    node.style.touchAction = 'none';
    node.style.userSelect = 'none';
    //node.style.border = '1px solid';
    this._node = node;

    const container = document.createElement('div');
    this._containerNode = container;
    this._node.appendChild(container);

    interact(node).draggable({
      listeners: {
        move: event => {
          this.toggleConstrainBrickSize(false);
          addClass(this.brick.node, 'moving');
          this._moveBy(event.dx, event.dy);

          // Nudge the brick a bit upwards to make it less covered by the users finger
          this.brick.node.style.transform = `translate(0px, -50px)`;
        },
        end: () => {
          this._emit('drop');
          removeClass(this.brick.node, 'moving');
          this.toggleConstrainBrickSize(true);
          this.brick.node.style.transform = '';
        },
      },
    });

    return node;
  }

  toggleConstrainBrickSize(contain = true, force = false) {
    if (contain === this._curContainState && !force) return;
    if (contain) {
      this.node.style.display = 'flex';
      this.node.style.flexDirection = 'column';
      this.node.style.justifyContent = 'space-around';

      this._containerNode.style.display = 'flex';
      this._containerNode.style.flexDirection = 'row';
      this._containerNode.style.justifyContent = 'space-around';

      const width = parseInt(this.node.style.width); // ugly but necessary
      this.brick.setSize(width / MAX_BRICK_WIDTH);
    } else {
      this.node.style.display = '';
      this.node.style.flexDirection = '';
      this.node.style.justifyContent = '';

      this._containerNode.style.display = '';
      this._containerNode.style.flexDirection = '';
      this._containerNode.style.justifyContent = '';
      this.brick.setSize(this.grid.tileWidth);
    }
    this._curContainState = contain;
  }

  moveTo(x, y) {
    const dx = x - this.position.x;
    const dy = y - this.position.y;
    this._moveBy(dx, dy);
  }

  _moveBy(x, y) {
    // Update brick position
    this.position = {
      x: this.position.x + x,
      y: this.position.y + y,
    };
    this.node.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
    this._emit('move');
  }

  setHomeEl(homeEl) {
    this.homeEl = homeEl;
    this.moveToHome();
  }

  moveToHome() {
    if (!this.homeEl) return;
    this._disableListeners = true;
    const { x, y, width, height } = this.homeEl.getBoundingClientRect();
    this.moveTo(x, y);
    this.node.style.width = width + 'px';
    this.node.style.height = height + 'px';
    this.toggleConstrainBrickSize(true, true);
    this._disableListeners = false;
  }

  on(event, callback) {
    if (typeof callback !== 'function') return this;
    if (!this._listeners[event]) this._listeners[event] = [];
    if (this._listeners[event].indexOf(callback) === -1) {
      this._listeners[event].push(callback);
    }
    return this;
  }

  _emit(event) {
    if (this._disableListeners) return;
    (this._listeners[event] || []).forEach(callback => callback());
  }

  destroy() {
    if (this._node) {
      this.node.remove();
    }
  }
}

let brickCount = 0;
class Brick {
  constructor(layout) {
    this.id = brickCount++;
    this.layout = layout;
  }

  get node() {
    if (this._node) return this._node;
    const node = document.createElement('div');
    addClass(node, 'brick');
    node.style.width = this.width * 20 + 'px';
    node.style.height = this.height * 20 + 'px';
    node.style.display = 'flex';
    node.style.flexDirection = 'column';
    node.style.justifyContent = 'space-evenly';
    node.style.transition = 'width 100ms, height 100ms';
    this._node = node;

    for (let i=0; i<this.height; i++) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'row';
      row.style.justifyContent = 'space-evenly';
      row.style.flexGrow = 1;
      for (let j=0; j<this.width; j++) {
        const part = document.createElement('div');
        part.style.flexGrow = 1;
        addClass(part, 'part');
        addClass(part, this.layout[i][j] ? 'filled' : '');
        row.appendChild(part);
      }
      node.appendChild(row);
    }

    return this._node;
  }

  setSize(size) {
    this.node.style.width = this.width * size + 'px';
    this.node.style.height = this.height * size + 'px';
  }

  disable() {
    if (!this._playable) return;
    this._playable = false;
    removeClass(this.node, 'playable');
  }

  enable() {
    if (this._playable) return;
    this._playable = true;
    addClass(this.node, 'playable');
  }

  get playable() {
    return this._playable;
  }

  get width() {
    return this.layout[0].length;
  }

  get height() {
    return this.layout.length;
  }
}


const startGame = () => {
  const scoreBoard = new Scoreboard();
  const grid = new Grid();

  window.grid = grid;
  document.getElementById('grid-container').appendChild(grid.node);

  const homes = [0,0,0];
  let bricks = [];
  let streak = 0;

  const recalculateSize = () => {
    bricks.forEach(({ handle }) => {
      handle.moveToHome();
    });
  };
  window.addEventListener('resize', recalculateSize);

  const checkAvailability = () => {
    bricks.forEach(b => {
      console.log('Checking playability');
      printLayout(b.layout);

      // Disable tiles that can't be placed anywhere
      if (grid.tiles.some(tile => grid.canLayoutBePlacedAt(b.layout, tile.x, tile.y))) {
        b.enable();
      } else {
        console.log('not playable');
        b.disable();
      }
    });

    // If no bricks can be played, end the current game and restart
    if (bricks.filter(b => !b.playable).length === bricks.length) {
      setTimeout(() => {
        const highScore = scoreBoard.highScore === scoreBoard.score;
        alert(`Game over! You scored ${highScore ? 'a new high ': ''}${scoreBoard.score}!`);
        grid.destroy();
        bricks.forEach(b => b.handle.destroy());
        startGame();
      }, 500);
    }
  };

  const createBrick = () => {
    const layout = BRICK_LAYOUTS[Math.floor(Math.random() * BRICK_LAYOUTS.length)];
    console.log('Adding:');
    printLayout(layout);
    const brick = new Brick(layout);
    const handle = new BrickHandle(brick, grid);
    bricks.push(brick);

    handle.on('move', () => {
      const brickPosition = brick.node.getBoundingClientRect();
      const relPos = grid.getInternalPos(brickPosition.x, brickPosition.y);
      //console.log(relPos);
      if (brick._lastRelPosX !== relPos.x || brick._lastRelPosY !== relPos.y) {
        brick._lastRelPosX = relPos.x;
        brick._lastRelPosY = relPos.y;
        const insideGridBounds = grid.isLayoutInsideBounds(brick.layout, relPos.x, relPos.y);

        if (insideGridBounds) {
          // Shade tiles beneath the hovering brick
          const coveredTiles = grid.getTilesCoveredByLayoutAt(brick.layout, relPos.x, relPos.y);

          // Highlight tiles belonging to wins if dropped here
          const hoverState = getStateWithBrickLayoutAtPos(brick.layout, relPos.x, relPos.y);
          const { state: winsState } = getWinsInState(combineState(grid.state, hoverState));
          const winningTiles = grid.getTilesFromState(winsState);
          grid.tiles.forEach(tile => { tile.unshade(); tile.unhighlight(); });
          if (!coveredTiles.find(tile => tile.blocked)) {
            coveredTiles.forEach(tile => tile.shade());
            winningTiles.forEach(tile => tile.highlight());
          }
        } else {
          grid.tiles.forEach(tile => { tile.unshade(); tile.unhighlight(); });
        }
      }
    });

    handle.on('drop', () => {
      const brickPosition = brick.node.getBoundingClientRect();
      const relPos = grid.getInternalPos(brickPosition.x, brickPosition.y);
      const insideGridBounds = grid.isLayoutInsideBounds(brick.layout, relPos.x, relPos.y);
      const coveredTiles = grid.getTilesCoveredByLayoutAt(brick.layout, relPos.x, relPos.y);
      console.log({insideGridBounds, blockedBy: coveredTiles.find(tile => tile.blocked)});

      // Drop the brick if it's inside the grid and there aren't any
      // occupied tiles below it
      if (insideGridBounds && !coveredTiles.find(tile => tile.blocked)) {
        console.log('dropping', brick.id, 'at', relPos.x, relPos.y);
        coveredTiles.forEach(tile => tile.block());
        handle.destroy();
        bricks = bricks.filter(b => b !== brick);
        grid.tiles.forEach(tile => { tile.unshade(); tile.unhighlight(); });

        scoreBoard.addPoints(brick.layout.flat().filter(p => !!p).length);

        // Check wins
        const { state: winsState, wins } = getWinsInState(grid.state);
        if (winsState.find(e => e)) {
          // Clear the tiles
          grid.getTilesFromState(winsState).forEach(tile => tile.unblock());

          // Hand out points for each new win
          scoreBoard.addPoints(wins * 18 + (wins > 1 ? (wins - 1) * 10 : 0));

          // Hand out points for streaks
          if (streak > 0) {
            scoreBoard.addPoints(streak * 10);
          }
          streak++;
        } else {
          streak = 0;
        }

        if (bricks.length === 0) {
          fillHomes();
        }

        setTimeout(() => {
          checkAvailability();
        }, 200);

      } else {
        handle.moveToHome();
      }
    });

    return { brick, handle };
  };

  const fillHomes = () => {
    homes.forEach((home, i) => {
      const { brick, handle } = createBrick();
      document.body.appendChild(handle.node);
      const homeEl = document.getElementById('home' + (i + 1));
      handle.setHomeEl(homeEl);
    });
  };

  fillHomes();
  checkAvailability();
};

document.addEventListener('DOMContentLoaded', startGame);
