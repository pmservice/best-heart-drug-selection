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
import styles from './style.css';
import classNames from 'classnames';

let genderTitles = {
  'M': 'Male',
  'F': 'Female'
}

function PersonCard (props) {
  let gender = genderTitles[props.data[1]];
  let age = props.data[0];
  let bp = props.data[2];
  let ch = props.data[3];
  let na = props.data[4];
  let k = props.data[5];
  let handleClick = function () {
    props.onChoose && props.onChoose(props.name, JSON.stringify(props.data));
  };

  return (
    <div onClick={handleClick} className={classNames(styles['user-card'], {'markWithColorBorder': props.highligth})}>
      <img className={styles['user-avatar']} src={'images/avatars/' + props.icon + '.svg'}/>
      <h1 className={classNames(styles['user-name'], {'markWithColor': props.highligth})}>{props.name}</h1>
      <p className={styles['user-title']}>{gender}, {age} years</p>

      <div className={styles['user-info']} style={{borderRight: '2px solid #DFDFDF'}}>
        <p className={styles['user-info-line1']}>BP</p>
        <p className={styles['user-info-line2']}>{bp}</p>
      </div>

      <div className={styles['user-info']} style={{borderRight: '2px solid #DFDFDF'}}>
        <p className={styles['user-info-line1']}>CH</p>
        <p className={styles['user-info-line2']}>{ch}</p>
      </div>

      <div className={styles['user-info']} style={{borderRight: '2px solid #DFDFDF'}}>
        <p className={styles['user-info-line1']}>NA</p>
        <p className={styles['user-info-line2']}>{na}</p>
      </div>

      <div className={styles['user-info']}>
        <p className={styles['user-info-line1']}>K</p>
        <p className={styles['user-info-line2']}>{k}</p>
      </div>
    </div>
  );
}

class PersonsList extends Component {
  constructor (props) {
    super(props);
    this.handleChoose = this.handleChoose.bind(this);
  }
  handleChoose (id, data) {
    this.props.onChoose && this.props.onChoose(id, data);
  }
  render () {
    let personList = this.props.persons.map((person, index) => {
      return <PersonCard
        key={index}
        name={person.name}
        icon={person.icon}
        data={person.data}
        onChoose={this.handleChoose}
        highligth={person.name === this.props.selected}
      />;
    });
    return (
      <div className={styles.usersContainer}>
        {personList}
      </div>
    );
  }
}

module.exports = PersonsList;
