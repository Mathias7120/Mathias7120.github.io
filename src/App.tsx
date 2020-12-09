import 'bootstrap/dist/css/bootstrap.min.css';
import * as React from 'react';
import { Button, Col, Container, Row } from 'reactstrap';
import './App.css';
import axios from 'axios';


import Game from './Game';

import logo from './logo.svg';
import { io } from 'socket.io-client';

export interface highscore {
  score: string;
  username: string;
}

export interface IState {
  gameRunning: boolean;
  isLoggedIn: boolean;
  gridSize: number;
  score: number;
  openLoginPromt: boolean;
  openRegisterPromt: boolean;
  username: string;
  password: string;
  highscores: highscore[];
}

class App extends React.Component<{}, IState> {
  // ws = new WebSocket('ws://127.0.0.1');
  socket = io('https://whispering-fortress-65690.herokuapp.com/');

  constructor(props: any) {
    super(props);

    this.state = {
      gameRunning: false,
      isLoggedIn: false,
      gridSize: 3,
      score: 0,
      openLoginPromt: false,
      openRegisterPromt: false,
      username: '',
      password: '',
      highscores: [],
    };

    this.setGridSize = this.setGridSize.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.onPause = this.onPause.bind(this);
    this.onScoreChange = this.onScoreChange.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onRegister = this.onRegister.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.userNameChangeHandler = this.userNameChangeHandler.bind(this);
    this.passwordChangeHandler = this.passwordChangeHandler.bind(this);
  }

  public componentDidMount() {
    this.socket.on('connect', () => {
      console.log('connected websocket');      
    });

    this.socket.on('disconnect', () => {
      console.log('disconnected');      
    });

    this.socket.on('highscore', (event: any) => {
      console.log(event);
      if(event.data) {
        const highscoreData = event.data;
        this.setState({highscores: highscoreData});
      }
      console.log(this.state.highscores);
      
    });
  }

  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to Double n Back Game</h1>
          <span className="spacer"></span>
          <Button color="primary" className={this.state.isLoggedIn ? 'hidden' : 'navButton'} onClick={this.onLogin}>Login</Button>
          <Button color="primary" className={this.state.isLoggedIn ? 'hidden' : 'navButton'} onClick={this.onRegister}>Register</Button>
          <Button color="primary" className={!this.state.isLoggedIn ? 'hidden' : 'navButton'} onClick={this.onLogout}>Logout</Button>
        </header>
        <Container>
          <Row>
            <Col xs="3">
              <input type="range" min="3" max="5" className="slider" value={this.state.gridSize} onInput={this.setGridSize} onChange={this.setGridSize} />
              <form className={!this.state.openLoginPromt && !this.state.openRegisterPromt ? 'hidden' : ''}>
                <h1 className={!this.state.openLoginPromt ? 'hidden' : ''}>Login</h1>
                <h1 className={!this.state.openRegisterPromt ? 'hidden' : ''}>Register</h1>
                <input type="text" name="username" onChange={this.userNameChangeHandler}></input>
                <input type="password" name="password" onChange={this.passwordChangeHandler}></input>
                <Button color="primary" onClick={this.submitHandler}>Submit</Button>
              </form>
            </Col>
            <Col xs="6">
              <Game rows={this.state.gridSize} columns={this.state.gridSize} running={this.state.gameRunning} onScoreChange={this.onScoreChange} />
            </Col>
            <Col xs="3">
              <Row>
                <Col xs="12">
                  <Button color="primary" className={this.state.gameRunning ? 'hidden' : ''} onClick={this.onPlay}>Play</Button>
                  <Button color="primary" className={!this.state.gameRunning ? 'hidden' : ''} onClick={this.onPause}>Stop</Button>
                </Col>
                <Col>
                  <div className="highscoreContainer">
                  <div className="highscoreItem">
                      <p>Highscore</p>
                      <p>User</p>
                    </div>
                  {this.state.highscores.map((item) => (
                    <div className="highscoreItem">
                      <p>{item.score}</p>
                      <p>{item.username}</p>
                    </div>
                  )) }
                  </div>
                </Col>
              </Row>
              <Row>
                <p>{this.state.score}</p>
              </Row>

            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  private setGridSize(e: any) {
    this.setState({ gridSize: e.target.value });
  }

  private onPlay(e: any) {
    this.setState({ gameRunning: true });
  }

  private onPause(e: any) {
    this.setState({ gameRunning: false });
    axios.post('https://whispering-fortress-65690.herokuapp.com/api/highscore', JSON.stringify({score: this.state.score}), this.getAxiosConfig()).then(res => {
      console.log(res);
      this.setState({score: 0});
    });
  }

  private onScoreChange(prevScore: number, nextScore: number) {
    this.setState({ score: nextScore });
  }

  private onLogin(e: any) {
    this.setState({ openLoginPromt: true, openRegisterPromt: false });
  }

  private onRegister(e: any) {
    this.setState({ openLoginPromt: false, openRegisterPromt: true });
  }

  private submitHandler = () => {
    if(this.state.openLoginPromt) {
      axios.post('https://whispering-fortress-65690.herokuapp.com/api/login', {username: this.state.username, password: this.state.password}).then(res => {
        let jwt = res.data.token as string;
				localStorage.setItem('token', jwt);
        this.setState({openLoginPromt: false});
        this.setState({isLoggedIn: true});
      })
      
    }
    else {
      axios.post('https://whispering-fortress-65690.herokuapp.com/api/register', {username: this.state.username, password: this.state.password}).then(res => {
        let jwt = res.data.token as string;
				localStorage.setItem('token', jwt);
        this.setState({openRegisterPromt: false});
        this.setState({isLoggedIn: true});
      })
    }
  }

  private userNameChangeHandler(event: any) {
    this.setState({username: event.target.value});
  }
 
  private passwordChangeHandler(event: any) {
    this.setState({password: event.target.value});
  }

  private onLogout(e: any) {
    localStorage.removeItem('token');
    this.setState({isLoggedIn: false});
  }

  private getAxiosConfig(): any {
    var t = localStorage.getItem('token');
    var axiosConfig = {
		  headers: {
			  'Content-Type': 'application/json',
			  Authorization: 'Bearer ' + t
		  }
    }
		
		return axiosConfig;
	}
}

export default App;
