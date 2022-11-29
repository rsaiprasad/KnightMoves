import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Chessground as NativeChessground } from 'chessground';
import { useToggle } from 'usehooks-ts';

import { squareFile, squareRank, FILE_NAMES, RANK_NAMES, parseSquare } from 'chessops';
import { parseFen } from 'chessops/fen'
import { knightAttacks } from 'chessops/attacks';


import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

const INITITAL_FEN = '8/8/8/8/3N4/8/8/8 w - - 0 1';

const getSquare = (square: number) => `${FILE_NAMES[squareFile(square)]}${RANK_NAMES[squareRank(square)]}`;
const brushColorMap: Record<string, string> = {
    '1': 'red',
    '2': 'orange',
    '3': 'blue',
    '4': 'green'
}


const knightMoves = (start: number, blockedSquares: number[] = []) => {
  const visited: Record<number, number> = {};
  let queue: number[] = [];
  let depth = 0;
  let paths: Record<number, number[][]> = [];
  queue.push(start);
  let nodesAtLevel = queue.length;
  while(queue.length > 0) {
    let node = queue.shift();
    if(typeof visited[node!] === 'undefined') {
      visited[node!] = depth;
      const aSquares = knightAttacks(node!);
      for(let square of aSquares) {
        //console.log(`-- square --`, square, `-- blocked squares --`, blockedSquares);
        if(blockedSquares.indexOf(square) !== -1) {
            //console.log(`-- ignoring square --`, square);
            continue;
        }
        queue.push(square);
      }
    }
    nodesAtLevel = nodesAtLevel-1;
    if(nodesAtLevel === 0) {
      nodesAtLevel = queue.length;
      depth = depth+1;
    }
  }
  return visited;
}

type Ground = ReturnType<typeof NativeChessground>;

const getSvgForNumber = (n: number) => {
    return `<text class="level level${n}">${n}</text>`;
}


const updateSquares = (ground: Ground, blockedSquares: number[] = []) => {
    const setup = parseFen(`${ground.getFen()} w - - 0 1`).unwrap();
    const shapes = [];
    for(let square of setup.board.knight) {
        const moves = knightMoves(square, blockedSquares);
        for(let sq in moves) {
            if(moves[sq]) {
                const orig = `${FILE_NAMES[squareFile(parseInt(sq))]}${RANK_NAMES[squareRank(parseInt(sq))]}` as any;
                const brushColor = brushColorMap[moves[sq].toString()];
                shapes.push( { orig, customSvg: getSvgForNumber(moves[sq]) });
                if(moves[sq] <= 3) {
                    //shapes.push( { orig, brush: brushColor ?? 'white' });
                }
            }
        }
    }
    ground.setAutoShapes(shapes);
}

export const ChessGround = () => {

    const chessBoardRef = useRef(null);
    const isLoaded = useRef(false);
    const [isBlocking, setBlocking] = useToggle(false);

    useEffect(() => {
        if(chessBoardRef.current && !isLoaded.current) {
            const blockedSquares: number[] = [];
            const ground = NativeChessground(chessBoardRef.current, {
                fen: INITITAL_FEN,
                highlight: {
                    lastMove: false
                },
                events: {
                    move: (org, dest, cap) => {
                        updateSquares(ground, blockedSquares);
                    },
                    select:(key) => {
                        if(isBlocking) {
                            const square = parseSquare(key)!;
                            if(blockedSquares.indexOf(square) === -1) {
                                blockedSquares.push(square);
                            }
                        }
                        updateSquares(ground, blockedSquares);
                        console.log(`-- blocked squares --`, blockedSquares);
                    }
                },
                drawable: {
                    brushes: {
                        white: { key: 'w', color: '#FFF', opacity: 1, lineWidth: 10 },
                        orange: { key: 'o', color: '#FFA500', opacity: 1, lineWidth: 10 },
                    }
                }
            });
            updateSquares(ground, blockedSquares);
            isLoaded.current = true;
        }
    },  [chessBoardRef.current]);

    return (<div id="wrapper">
        <div id="chessground" ref={chessBoardRef}></div>
        <div id="controls">
            <button onClick={setBlocking}>{isBlocking ? 'Done blocking': 'Block squares' }</button>
        </div>
    </div>)
}