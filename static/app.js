let Person = function(name, email) {
    this.name = name;
    this.email = email;
    this.exceptions = [];
    this.exception_emails = [];  // only used in csv import
    this.errors = [];
};
Person.prototype.has_error = function (name) {
  return _.indexOf(this.errors, name) != -1;
};

let Match = function(buyer, recipient) {
    this.buyer = buyer;
    this.recipient = recipient;
};

let init_participants = function() {
  // start off with a list of blank participants
  let participants = [];
  _.forEach(_.range(0, 4), function(v, i) {
      participants.push(new Person());
  });
  
  return participants;
};

let validateEmail = function (email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

let assign = function(participants) {
  let assigned = [];
  
  _.forEach(participants.slice(), function(participant) {
    
    // remove self, assigned and exceptions
    let available_recipients = _.filter(participants, function(p) {
      // self
      if (p.email === participant.email) {
          console.log('self', participant);
        return false; 
      }
      // assigned
      if (_.find(assigned, function(a) {return a.recipient.email === p.email})) {
          console.log('assigned', participant);
        return false;
      }
      // exception
      return !_.find(participant.exceptions, function(exception) {
        // exceptions are in the select "options" format so check "value"
        return exception.value === p.email;
      });
    });
    
    // choose a random participant
    if (available_recipients.length) {
      assigned.push(new Match(
        participant, available_recipients[_.random(available_recipients.length - 1)]));
    } else {
      throw 'Failed matching';
    }
  });
  
  return assigned;
};

Vue.component('v-select', VueSelect.VueSelect);

let app = new Vue({
  el: '#secret-santa',
  delimiters: ['{$', '$}'],
  data: {
    participants: init_participants(),
    assigned: [],
    error: null,
    secret: false,
    email_sent: false,
    participant_exceptions: [],
  },
  methods: {
    addParticipant: function() {
        console.log(this.participants);
      this.participants.push(new Person());
      this.assigned = [];
    },
    importParticipants: function() {
        CSV.fetch({
                file: document.getElementById('csv').files[0],
            }
        ).then((dataset) => {
            this.participants = [];
            _.forEach(dataset.records, (row) => {
                let participant = new Person(row[0], row[1]);
                if (row.length > 2) {
                    participant.exception_emails = row[2].split('|');
                }
                this.participants.push(participant);
            });
            _.forEach(this.participants, (participant) => {
                _.forEach(participant.exception_emails, (email) => {
                    const match = _.find(this.participants, (p) => {
                        return p.email === email;
                    });
                    if (match) {
                        participant.exceptions.push({
                            label: match.name,
                            value: match.email,
                        });
                    }
                });
            });
        });
    },
    removeParticipant: function(i) {
      this.participants.splice(i, 1);
      this.assigned = [];
    },
    assign: function(e) {
        this.email_sent = false;
        this.error = null;
      
        // remove blank entries
        this.participants = _.filter(this.participants, function(p) {return p.name || p.email});
        if (!this.participants.length) {
         this.error = 'There are no valid participants to assign'; 
         return;
        }
        
        if (!this.validate()) {
          return;
        }
        
        // reset assignments
        this.assigned = [];
        
        // use a reasonable attempt limit
        let i = 0;
        while(!this.assigned.length && i++ <= 100) {
          this.assigned = [];
            try {
                this.assigned = assign(this.participants);
            } catch (e) {
            }
        }
        if (!this.assigned.length) {
          this.error = 'There are too many exclusions to assign correctly';
        }
    },
    exceptions: function (participant) {
      // remove the participant as an exception option
      let exceptions = _.filter(this.participants, function(p) {return p.email !== participant.email});
      exceptions.unshift();
      return exceptions;
    },
    exceptions_options: function (participant) {
      if (!participant.email) {
        return [];
      }
      return _.map(_.filter(this.exceptions(participant), function(p) { return p.email; }), function(exception) {
        return {
          label: exception.name,
          value: exception.email,
        };
      });
    },
    is_valid: function () {
      let valid = true;
      _.forEach(this.participants.slice(), function(participant, index) {
        if (participant.errors.length) {
          valid = false;
          return;
        }
      });
      return valid;
    },
    validate: function(participant) {
      let participants = participant ? [participant] : this.participants;
      _.forEach(participants.slice(), function(participant, index) {
        if (!participant.name || !participant.name.length) {
          participant.errors.push('name');
        } else {
          participant.errors = _.filter(participant.errors, function(e) {
            return e != 'name';
          });
        }
        if (!validateEmail(participant.email)) {
          participant.errors.push('email');
        } else {
          participant.errors = _.filter(participant.errors, function(e) {
            return e != 'email';
          });
        }
      });
      return this.is_valid();
    },
    send_emails: function() {
      let app = this;
      this.$http.post('/send-emails', {'assignments': this.assigned}, {'headers': {'content-type': 'application/json'}}).then((response) => {
        console.log('success', response);
        app.email_sent = true;
      }, (response) => {
        console.log('failure', response);
      });
    }
  },
});