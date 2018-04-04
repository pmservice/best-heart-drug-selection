/*
   Copyright 2017 IBM Corp.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import styles from './style.scss';
import Chart from '../Chart';

const predictionsMapping = require('../../../config/model.json')['model-prediction-mapping'];
const modelInfo = require('../../../config/model.json');

const genderTitles = {
  'M': 'Male',
  'F': 'Female'
};

class Result extends Component {
  constructor (props) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
  }

  componentDidMount () {
    location.href = '#scoringResult';
  }

  handleClose () {
    this.props.onClose && this.props.onClose();
  }

  //  <img src={'images/predictions/' + best.drug[1]}/>

  render () {
    let {probability} = this.props;
    // translate index to a drug, remove 0% probabilities and sort descendingly
    probability = probability
    .map((val, index) => ({drug: predictionsMapping[index], value: Math.round(val * 100)}))
    .filter(a => a.value > 0)
    .sort((a, b) => b.value - a.value);
    let best = probability.shift();

    const scoringValues = this.props.scoringResult.values[0];
    const age = scoringValues[0];
    const gender = genderTitles[scoringValues[1]];
    const bp = scoringValues[2];
    const ch = scoringValues[3];
    const na = scoringValues[4];
    const k = scoringValues[5];

    let scoringChart = (<Chart scoringResult={this.props.scoringResult} />);

    return (
      <div id="scoringResult" className={styles['scoring-result']}>
        <div className={styles['scoring-result-left']}>
          <h1>{best.value}% {best.drug}</h1>
          <p className={styles['scoring-paragraph']}>Based
          on your selection, <span className={classNames(styles['bold'], 'markWithColor')}>{best.drug}</span> is recommended for
          <span className={classNames(styles['bold'], 'markWithColor')}> {this.props.id}</span> with probability of {best.value}%.
          </p>
        </div>

        <div className={styles['scoring-result-right']}>
          {scoringChart}

          <div style={{display: 'flex', alignItems: 'start', marginRight: '-20px', marginTop: '-20px'}}>
            <img src='/images/close.png' onClick={this.handleClose} style={{cursor: 'pointer'}}/>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Result;
