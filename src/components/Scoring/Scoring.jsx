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

import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import Table from '../DeploymentsTable';
import PersonsList from '../PersonsList';
import ScoringResult from './Result.jsx';
import Loading from '../Loading';
import styles from './style.scss';

const modelInfo = require('../../../config/model.json');

const propTypes = {
  onAlert: PropTypes.func
};

class Scoring extends Component {
  constructor (props) {
    super(props);
    this.state = {
      deployments: [],
      deploymentsLoading: true,
      predictionLoading: false,
      feedbackLoading: false
    };
    this.persons = modelInfo['model-input'];
    this.expectedSchema = modelInfo['model-schema'];
    this.handlePredicting = this.handlePredicting.bind(this);
    this.handleFeedback = this.handleFeedback.bind(this);
    this.setScoringData = this.setScoringData.bind(this);
    this.setScoringHref = this.setScoringHref.bind(this);
    this.reset = this.reset.bind(this);
  }

  componentWillMount () {
    let ctx = this;

    let fieldTypeAliases = {
      'decimal': 'integer'
    };

    function baseFieldType (fieldType) {
      fieldType = fieldType.split('(')[0]; // get rid of type size e.g. 'decimal(12,6)'
      if (fieldTypeAliases.hasOwnProperty(fieldType)) {
        fieldType = fieldTypeAliases[fieldType];
      }
      return fieldType;
    }

    function sameFiledTypes (typeA, typeB) {
      return baseFieldType(typeA) === baseFieldType(typeB);
    }

    this.serverRequest = $.get('/env/deployments', function (result) {
      // validate deployment's model schema
      result = result.filter((d) => {
        if (!d.model || !d.model.input_data_schema || !d.model.input_data_schema ||
          !d.model.input_data_schema.fields || !d.model.runtimeEnvironment || !d.model.runtimeEnvironment.includes('spark')) {
          return false;
        }
        return true;
      }).map(d => {
        let matches = false;
        let schema = d.model.input_data_schema.fields.sort(function (a, b) { return a.name - b.name; });
        let expectedSchema = ctx.expectedSchema.sort(function (a, b) { return a.name - b.name; });
        if (schema.length === expectedSchema.length) {
          matches = true;
          for (let i = 0; i < schema.length; i++) {
            if (!sameFiledTypes(schema[i].type, expectedSchema[i].type) || (schema[i].name !== expectedSchema[i].name)) {
              matches = false;
              break;
            }
          }
        }
        d.disabled = !matches;
        d.createdAt = new Date(d.createdAt).toLocaleString();
        return d;
      });
      ctx.setState({
        deployments: result,
        deploymentsLoading: false
      });
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      ctx.setState({
        deploymentsLoading: false
      });
      console.log(errorThrown);
      let err = errorThrown;
      if (jqXHR.responseJSON) {
        err = jqXHR.responseJSON.errors;
      } else if (jqXHR.responseText) {
        err = jqXHR.responseText;
      }
      ctx._alert(err);
    });
  }

  _alert (message) {
    this.props.onAlert ? this.props.onAlert(message) : console.warn(message);
  }

  setScoringData (id, data) {
    console.log('setScoringData', this.state.scoringData);
    if (this.state.scoringData && this.state.scoringData.id === id) {
      return;
    }
    this.setState({
      scoringData: {id: id, value: data},
      scoringResult: null,
      feedbackResult: null
    }, () => {
      console.log('setScoringData', this.state.scoringData);
      this.handlePredicting();
    });
  }

  setScoringHref (id, data, feedbackUrl) {
    console.log(feedbackUrl);
    if (this.state.scoringHref && this.state.scoringHref.id === id) {
      return;
    }
    this.setState({
      scoringHref: {id: id, value: data},
      scoringResult: null,
      feedbackUrl: feedbackUrl,
      feedbackResult: null
    });
  }

  reset () {
    this.setState({
      scoringResult: null,
      scoringHref: null,
      scoringData: null
    });
  }

  handlePredicting () {
    if (this.state.scoringHref == null) {
      this._alert('Select a Deployment');
      return;
    }
    if (this.state.scoringData == null) {
      this._alert('Select a Patient');
      return;
    }
    this.setState({
      predictionLoading: true
    });
    var data = {
      scoringData: this.state.scoringData.value,
      scoringHref: this.state.scoringHref.value
    };
    this.score(data, (error, result) => {
      if (!error) {
        console.log('scoringResult', result);
        this.setState({
          scoringResult: result,
          predictionLoading: false
        });
      } else {
        this.setState({
          predictionLoading: false
        });
        this._alert(error);
      }
    });
  }

  handleFeedback (drugName, e) {
    e.preventDefault();
    console.log(drugName);
    if (this.state.scoringHref == null) {
      this._alert('Select a Deployment');
      return;
    }
    if (this.state.scoringData == null) {
      this._alert('Select a Patient');
      return;
    }
    this.setState({
      feedbackLoading: true
    });
    var feedbackData = JSON.parse(this.state.scoringData.value);
    feedbackData.push(drugName);
    var data = {
      feedbackData: JSON.stringify(feedbackData),
      feedbackUrl: this.state.feedbackUrl
    };
    this.sendFeedback(data, (error, result) => {
      if (!error) {
        this.setState({
          feedbackLoading: false,
          feedbackResult: result || true
        });
      } else {
        this._alert(error);
        this.setState({
          feedbackLoading: false
        });
      }
    });
  }

  sendFeedback (feedbackData, callback) {
    $.post('/env/feedback/', feedbackData, function (response) {
      if (response.errors) {
        callback(response.errors);
      }
      callback(null, response.score);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      let err = (jqXHR.responseJSON ? jqXHR.responseJSON.errors : 'Feedback service failure.');
      /* extract error */
      let e = [jqXHR];
      try {
        e = e[0].responseJSON.error;
      } catch (e) {
        // suppress
      }
      err += ((typeof e === 'undefined') ? 'Undefined error' : e);
      callback && callback(err);
    });
  }

  score (scoringData, callback) {
    $.post('/env/score/', scoringData, function (response) {
      if (response.errors) {
        callback(response.errors);
      }
      callback(null, response.score);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      let err = (jqXHR.responseJSON ? jqXHR.responseJSON.errors : 'Scoring service failure.');
      /* extract error */
      let e = [jqXHR];
      try {
        e = e[0].responseJSON.error;
      } catch (e) {
        // suppress
      }
      err += ((typeof e === 'undefined') ? 'Undefined error' : e);
      callback && callback(err);
    });
  }

  componentWillUnmount () {
    this.serverRequest.abort();
  }

  render () {
    let scoringResult, feedbackPanel;
    if (this.state.scoringResult) {
      scoringResult = (<ScoringResult
        id={this.state.scoringData.id}
        deployment={this.state.scoringHref.id}
        probability={this.state.scoringResult.probability.values}
        onClose={this.reset}
        scoringResult={this.state.scoringResult}
        handleFeedback={this.handleFeedback}
        feedbackResult={this.state.feedbackResult}
      />);

      let feedbackButtons = modelInfo['label-values'].map(label => {
        return (
          <div className={styles.feedbackButton}>
            <div onClick={(e) => this.handleFeedback(label.value, e)} className={styles.runButton + ' center'}>{label.title}</div>
          </div>
        );
      });

      feedbackPanel = (<div id="scoringResult" className={styles['scoring-result']} style={{paddingTop: '15px'}}>
      {
        !this.state.feedbackResult && !this.state.feedbackLoading ? (
        <div style={{width: '100%'}}>
          <p>We would like to know your opinion which drug is the most suitable for this patient?</p>
          {feedbackButtons}
        </div>) : !this.state.feedbackLoading ?
        (<div style={{display: 'flex', alignItems: 'left'}}>
          <p style={{paddingLeft: '20px', textAlign: 'left'}}>Thank you for your feedback!<br />Your suggestions will improve the future predictions.</p>
        </div>) : (<Loading></Loading>)
      }
      </div>);
    }

    return (
      <div>
        <div className={styles.group}>
          <h3>Select a Deployment</h3>
          <Table data={this.state.deployments} onChoose={this.setScoringHref} className="center" selected={this.state.scoringHref && this.state.scoringHref.id} loading={this.state.deploymentsLoading}/>
        </div>
        { this.state.scoringHref ? (<div className={styles.group}>
          <h3>Select a Patient</h3>
          <PersonsList persons={this.persons} onChoose={this.setScoringData} selected={this.state.scoringData && this.state.scoringData.id}/>
        </div>) : null}
        <div className={styles.group}>
          { this.state.predictionLoading ? (<Loading></Loading>) : null}
          {scoringResult}
          {feedbackPanel}
        </div>
        { this.state.scoringData && this.state.scoringHref && this.state.scoringResult ? (<div className={styles.group}>
          <div onClick={this.handlePredicting} className={styles.runButton + ' center'} style={{marginBottom: '30px'}}>Regenerate Predictions</div>
        </div>) : null}
      </div>
    );
  }
}

Scoring.propTypes = propTypes;

module.exports = Scoring;
