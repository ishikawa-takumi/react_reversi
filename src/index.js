import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {showMark(props.value)}
    </button>
  );
}
  
class Board extends React.Component {
  renderSquare(x,y,nextPlayer) {
    return (
      <Square 
        value={this.props.squares[y][x]} 
        key={x+y*TABLE_SIZE}
        onClick={()=>{
          this.props.onClick(x,y);

         }}
        />
    );
  }

  render() {
    const tableSquare = ([...Array(8).keys()]).map(row => (
      <div className="board-row" key={row}>
        {[...Array(8).keys()].map(col => this.renderSquare(col, row, this.props.currentPlayer))}
      </div>
    ));
    return (
      <div>
        {tableSquare}
      </div>
    );
  }
}

const TABLE_SIZE = 8;
const WHITE_MARK_ID = 1;
const BLACK_MARK_ID = 2;
const INIT_TABLE = 
[ 
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null,    1,    2, null, null, null],
  [null, null, null,    2,    1, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
];

class Game extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      history: [{
        squares: INIT_TABLE,
        player: BLACK_MARK_ID
      }],
      stepNumber: 0,
      currentPlayer: BLACK_MARK_ID,
      winner: 0
    };
  }

  getFlippableList(squares, x, y, playerId) {
    const REV = -1;
    const CURRENT = 0;
    const NEXT = 1;
    const DIRECTIONS = [REV, CURRENT, NEXT];
    let flippableList = [];
    
    DIRECTIONS.forEach((dy) => {
      DIRECTIONS.forEach((dx) => {
        
        if( dx === CURRENT && dy === CURRENT ) {
          return;
        }
        let tmp = [];
        let depth = 0;
        
        while( true ) { 
          depth += 1;

          const rx = x + dx*depth;
          const ry = y + dy*depth;
          if( rx < 0 || TABLE_SIZE <= rx || ry < 0 || TABLE_SIZE <= ry ) {
            break;
          }
          let value = squares[ry][rx];

          if( value === null ) {
            break;
          }

          if( value === playerId ) {
            if( tmp.length !== 0 ) {
              flippableList = flippableList.concat(tmp);
            }
            break;
          }
          else {
            tmp.push([rx, ry]);
          }
        }
      });
    });
    return flippableList;
  }

  handleClick(x, y) {
    const history = this.state.history.slice(0, this.state.stepNumber+1);
    const current = this.state.history[history.length-1];
    const squares = current.squares.map((square) => {
      return square.slice();
    });
    const currentPlayer = current.player;
    if( squares[y][x] ) {
      return;
    }

    const flippableList = this.getFlippableList(squares, x, y, currentPlayer);

    if( flippableList.length === 0 ) {
      return;
    }

    squares[y][x] = currentPlayer;
    flippableList.forEach((position) => {
      squares[position[1]][position[0]] = currentPlayer;
    });

    const nextPlayer = this.getNextPlayer(squares, currentPlayer);

    
    this.setState({
      history: history.concat([{
        squares: squares,
        player: nextPlayer===-1 ? currentPlayer : nextPlayer
      }]),
      stepNumber: history.length,
      winner: nextPlayer===-1 ? currentPlayer : 0
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
    });
  }

  goBack() {
    this.setState({
      stepNumber: this.state.stepNumber > 0 ? this.state.stepNumber - 1 : this.state.stepNumber
    });
  }

  goForward() {
    this.setState({
      stepNumber: this.state.history.length-1 > this.state.stepNumber ? this.state.stepNumber+1 : this.state.stepNumber
    });
  }

  getPoint(squares, playerId) {
    let count = 0;
    for(let y=0; y<TABLE_SIZE; y++) {        
      for(let x=0; x<TABLE_SIZE; x++) {        
        if( squares[y][x] === playerId ) {
          count += 1;
        }
      }
    }
    return count;
  }

  showPlayerPoints(squares) {
    const firstPlayer = this.getPoint(squares, BLACK_MARK_ID);
    const secondPlayer = this.getPoint(squares, WHITE_MARK_ID);

    return(
      <div>{showMark(BLACK_MARK_ID)}:{firstPlayer} {showMark(WHITE_MARK_ID)}:{secondPlayer}</div>
    )
  }

  getNextPlayer(squares, currentPlayer) {
    let count = 0;
    let empty_count = 0;
    let nextPlayer = (currentPlayer===BLACK_MARK_ID ? WHITE_MARK_ID : BLACK_MARK_ID);

    for(let y=0; y<TABLE_SIZE; y++) {
      for(let x=0; x<TABLE_SIZE; x++) {
        if( squares[y][x] === null ) {
          let flippableList = this.getFlippableList(squares, x, y, nextPlayer);
          count += flippableList.length;
          empty_count += 1;
        }
      }
    }

    if( empty_count === 0 ) {
      return -1;
    }
    else if(count === 0) {
      count = 0;
      nextPlayer = (nextPlayer===BLACK_MARK_ID ? WHITE_MARK_ID : BLACK_MARK_ID);
      for(let y=0; y<TABLE_SIZE; y++) {
        for(let x=0; x<TABLE_SIZE; x++) {
          if( squares[y][x] === null ) {
            let flippableList = this.getFlippableList(squares, x, y, nextPlayer);
            count += flippableList.length;
          }
        }
      }
      if( count === 0 ) {
        return -1;
      }
    }
    return nextPlayer;
  }

  showStepButton() {
    return (
      <div className="step-buttons">
        <button onClick={()=>this.goBack()} className="step-button">Back</button>
        <button onClick={()=>this.goForward()} className="step-button">Go</button>
      </div>
    );
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];

    const moves = history.map((step, move) => {
      const desc = move ?
      'go to move #' + move :
      'go to game start';
      return (
        <li key={move}>
          <button onClick={()=>this.jumpTo(move)} className="move-list">{desc}</button>
        </li>
      );
    });

    let status;
    if(this.state.winner) {
      status = 'winner: ' + showMark(current.player);
    }else {
      status = 'next player: ' + showMark(current.player);
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board 
            squares={current.squares}
            onClick={(x,y)=>{
              this.handleClick(x,y);
              }}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          {this.showPlayerPoints(current.squares)}
          {/* <ol>{moves}</ol> */}
          {this.showStepButton()}
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function showMark( markId ) {
  if(markId === BLACK_MARK_ID)
    return '○';
  else if (markId === WHITE_MARK_ID)
    return '●';
  else 
    return null
}