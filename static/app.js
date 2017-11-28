var Person = function(name, email) {
    this.name = name;
    this.email = email;
    this.exceptions = [];
    this.errors = [];
}
Person.prototype.has_error = function (name) {
  return _.indexOf(this.errors, name) != -1;
}

var Match = function(buyer, recipient) {
    this.buyer = buyer;
    this.recipient = recipient;
}

var init_participants = function() {
  // start off with a list of blank participants
  var participants = [];
  _.forEach(_.range(0, 4), function(v, i) {
      participants.push(new Person());
  });
  
  return participants;
}

var validateEmail = function (email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

var assign = function(participants) {
  var assigned = [];
  
  _.forEach(participants.slice(), function(participant, index) {
    
    // remove self, assigned and exceptions
    var available_recipients = _.filter(participants, function(p) {
      // self
      if (p.email == participant.email) {
        return false; 
      }
      // assigned
      if (_.find(assigned, function(a) {return a.recipient.email == p.email})) {
        return false; 
      }
      // exception
      var exists = _.find(participant.exceptions, function(exception) {
        // exceptions are in the select "options" format so check "value"
        return exception.value === p.email;
      });
      if (exists) {
        return false;
      }
      return true;
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

var app = new Vue({
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
      this.participants.push(new Person());
      this.assigned = [];
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
        var i = 0;
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
      var exceptions = _.filter(this.participants, function(p) {return p.email != participant.email});
      exceptions.unshift();
      return exceptions;
    },
    exceptions_options: function (participant) {
      if (!participant.email) {
        return [];
      }
      var options = _.map(_.filter(this.exceptions(participant), function(p) { return p.email; }), function(exception) {
        return {
          label: exception.name,
          value: exception.email,
        };
      });
      return options;
    },
    is_valid: function () {
      var valid = true;
      _.forEach(this.participants.slice(), function(participant, index) {
        if (participant.errors.length) {
          valid = false;
          return;
        }
      });
      return valid;
    },
    validate: function(participant) {
      var participants = participant ? [participant] : this.participants;
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
      var app = this;
      this.$http.post('/send-emails', {'assignments': this.assigned}, {'headers': {'content-type': 'application/json'}}).then((response) => {
        console.log('success', response);
        app.email_sent = true;
      }, (response) => {
        console.log('failure', response);
      });
    }
  },
});