import React, { useEffect, useRef, useState } from 'react';
import { Chessground as NativeChessground } from 'chessground';

import { squareFile, squareRank, FILE_NAMES, RANK_NAMES, parseSquare } from 'chessops';
import { parseFen } from 'chessops/fen'
import { knightAttacks } from 'chessops/attacks';


import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

const INITITAL_FEN = '8/8/8/8/3N4/8/8/8 w - - 0 1';

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
        if(blockedSquares.indexOf(square) !== -1) {
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

const getSvgForCross = () => {
    return `<text class="level cross">x</text>`;
}

export const ChessGround = () => {

    const chessBoardRef = useRef(null);
    const isLoaded = useRef(false);
    const [isBlocking, setBlocking] = useState<boolean>(false);
    const [blockedSquares, setBlockedSquares] = useState<number[]>([]);
    const [ground, setGround] = useState<Ground>();

    const updateSquares = () => {
        if(ground) {
            const setup = parseFen(`${ground.getFen()} w - - 0 1`).unwrap();
            const shapes = [];
            for(let square of setup.board.knight) {
                const moves = knightMoves(square, blockedSquares);
                for(let sq in moves) {
                    if(moves[sq]) {
                        const orig = `${FILE_NAMES[squareFile(parseInt(sq))]}${RANK_NAMES[squareRank(parseInt(sq))]}` as any;
                        shapes.push( { orig, customSvg: getSvgForNumber(moves[sq]) });
                        if(moves[sq] <= 3) {
                            //shapes.push( { orig, brush: brushColor ?? 'white' });
                        }
                    }
                }
            }
            for(let square of blockedSquares) {
                const orig = `${FILE_NAMES[squareFile(square)]}${RANK_NAMES[squareRank(square)]}` as any;
                shapes.push({ orig, customSvg: getSvgForCross()});
                shapes.push( { orig, brush: 'red' });
            }
            ground.setAutoShapes(shapes);
        }
    }


    const handleSquareSelect = (key: string) => {
            if(isBlocking) {
                const square = parseSquare(key)!;
                setBlockedSquares((prev: number[]) => {
                    const indexOfSquare = blockedSquares.indexOf(square);
                    if(indexOfSquare === -1) {
                        return [...prev, square];
                    } 
                    const existingSquares = [...prev];
                    existingSquares.splice(indexOfSquare, 1);
                    return existingSquares;
                });

            }
            updateSquares();
    }

    useEffect(() => {
        if(chessBoardRef.current && !isLoaded.current) {
            const ground = NativeChessground(chessBoardRef.current, {
                fen: INITITAL_FEN,
                highlight: {
                    lastMove: false
                },
                drawable: {
                    brushes: {
                        white: { key: 'w', color: '#FFF', opacity: 1, lineWidth: 10 },
                        orange: { key: 'o', color: '#FFA500', opacity: 1, lineWidth: 10 },
                    }
                }
            });
            setGround(ground);
            isLoaded.current = true;
        }
    },  [chessBoardRef.current]);

    useEffect(() => {
        if(ground) {
            updateSquares();
            ground.set({events: {
                move: updateSquares,
                select: handleSquareSelect
            }})
           
        }
    }, [ground, updateSquares, handleSquareSelect]);

    return (<div id="wrapper">
        <div id="chessground" ref={chessBoardRef}></div>
        <div id="controls">
            <button onClick={() => {setBlocking((prev) => !prev); }}>{isBlocking ? 'Done blocking': 'Block squares' }</button>
            {!!blockedSquares.length && (<button onClick={() => {setBlockedSquares([]); }}>Clear blocked squares</button>)}
            <div id="instructions">
                <ul>
                    <li>Drag the knight to a square to see the number of moves it will take to reach other squares</li>
                    <li>Click the "Block squares" button above to mark some squares as blocked for calculating move count</li>
                </ul>
            </div>
        </div>
    </div>)
}