var Person = function(name, email) {
    this.name = name;
    this.email = email;
    this.exception = null;
}
var Match = function(buyer, recipient) {
    this.buyer = buyer;
    this.recipient = recipient;
}

// start off with a list of blank participants
var participants = [];
_.forEach(_.range(0, 4), function(v, i) {
    participants.push(new Person('Name ' + i, i+'@'+i+'.com'));
});

var assign = function() {
  var assigned = [];
  
  _.forEach(participants.slice(), function(participant, index) {
    
    var matched = false;
    
    while(!matched) {
      
      // max attempts
      if (index >= participants.length) {
        throw 'Failed matching';
      }
      
      // remove self, assigned and exceptions
      available_recipients = _.filter(participants, function(p) {
        return (p.email != participant.email) && !_.find(assigned, function(a) {return a.recipient.email == p.email});
      });
      
      //console.log(_.map(available_recipients, function(a) {return a.email}));
      
      if (!available_recipients.length) {
        throw 'Failed matching';
      }
      
      var chosen = available_recipients[_.random(available_recipients.length - 1)];
      assigned.push(new Match(participant, chosen));
      matched = true;
    }
  }),
  console.log(assigned);
  console.log(_.map(assigned, function(a) {return {from: a.buyer.email, to: a.recipient.email}}));
  return assigned;
};

var app = new Vue({
  el: '#participants',
  delimiters: ['{$', '$}'],
  data: {
    participants: participants,
  },
  methods: {
    addParticipant: function() {
      console.log('f');
      participants.push(new Person());
    },
    removeParticipant: function(i) {
      participants.splice(i, 1);
    },
    assign: function() {
        var assigned = []
        while(!assigned.length) {
            try {
                assigned = assign();
            } catch (e) {
                console.log(e); 
            }
        }
    },
    exceptions: function (participant) {
      var exceptions = _.filter(participants, function(p) {return p.email != participant.email});
      exceptions.unshift();
      return exceptions;
    },
  },
}) 
