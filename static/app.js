var Person = function(name, email) {
    this.name = name;
    this.email = email;
    this.exception = '';
}

var Match = function(buyer, recipient) {
    this.buyer = buyer;
    this.recipient = recipient;
}

var init_participants = function() {
  // start off with a list of blank participants
  var participants = [];
  _.forEach(_.range(0, 4), function(v, i) {
      participants.push(new Person('Name ' + i, i+'@'+i+'.com'));
  });
  
  return participants;
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
      if (participant.exception && participant.exception.email == p.email) {
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

Vue.use(VeeValidate);
var app = new Vue({
  el: '#secret-santa',
  delimiters: ['{$', '$}'],
  data: {
    participants: init_participants(),
    assigned: [],
    error: null,
    secret: false,
  },
  methods: {
    addParticipant: function() {
      this.participants.push(new Person());
    },
    removeParticipant: function(i) {
      this.participants.splice(i, 1);
    },
    assign: function(e) {
      
        // remove blank entries
        this.participants = _.filter(this.participants, function(p) {return p.name});
        
        // reset assignments
        this.assigned = [];
        
        // use a reasonable attempt limit
        var i = 0;
        while(!this.assigned.length && i++ <= 100) {
          this.assigned = [];
            try {
                this.assigned = assign(this.participants);
            } catch (e) {
                console.log(e); 
            }
        }
        if (!this.assigned.length) {
          this.error = 'There are too many exceptions to assign correctly';
        }
        e.preventDefault();
    },
    exceptions: function (participant) {
      var exceptions = _.filter(this.participants, function(p) {return p.email != participant.email});
      exceptions.unshift();
      return exceptions;
    },
  },
}) 
