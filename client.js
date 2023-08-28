//var Color = importNamespace('PixelCombats.ScriptingApi.Structures');
//var System = importNamespace('System');

// ���������
var WaitingPlayersTime = 10;
var BuildBaseTime = 30;
var GameModeTime = 420;
var EndOfMatchTime = 10;

// константы
var WaitingStateValue = "Waiting";
var BuildModeStateValue = "BuildMode";
var GameStateValue = "Game";
var EndOfMatchStateValue = "EndOfMatch";
var EndAreaTag = "parcourend"; 	// тэг зоны конца паркура
var LeaderBoardProp = "Leader"; // свойство для лидерборда

// постоянные переменные
var mainTimer = Timers.GetContext().Get("Main"); 		// таймер конца игры
var endAreas = AreaService.GetByTag(EndAreaTag);		// зоны конца игры
var stateProp = Properties.GetContext().Get("State");	// свойство состояния
var inventory = Inventory.GetContext();					// контекст инвентаря

// параметры режима
Damage.FriendlyFire = false;

// ��������� ����
TeamsBalancer.IsAutoBalance = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;

BreackGraph.OnlyPlayerBlocksDmg = GameMode.Parameters.GetBool("PartialDesruction");
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool("LoosenBlocks");

// блок игрока всегда усилен
BreackGraph.PlayerBlockBoost = true;

// запрещаем все в руках
inventory.Main.Value = false;
inventory.Secondary.Value = false;
inventory.Melee.Value = false;
inventory.Explosive.Value = false;
inventory.Build.Value = false;


// создаем команду
Teams.Add("Blue", "Заключенные", { b: 50 });
var blueTeam = Teams.Get("Blue");
blueTeam.Spawns.SpawnPointsGroups.Add(1);
blueTeam.Spawns.RespawnTime.Value = 0;
blueTeam.Build.BlocksSet.Value = BuildBlocksSet.Blue;
contextedProperties.GetContext(blueTeam).SkinType.Value = 2;
contextedProperties.GetContext(blueTeam).MaxHp.Value = 200;
Teams.Add("Red", "Oхрана", { r: 100 });
var redTeam = Teams.Get("Red");
redTeam.Spawns.SpawnPointsGroups.Add(2);
redTeam.Spawns.RespawnTime.Value = 0;
redTeam.Build.BlocksSet.Value = BuildBlocksSet.Red;
redTeam.Inventory.Main.Value = false;
redTeam.Inventory.Secondary.Value = false;
redTeam.Inventory.Melee.Value = true;
redTeam.Inventory.Explosive.Value = false;
redTeam.Inventory.Build.Value = true;

// количество времени спавна
blueTeam.Spawns.RespawnTime.Value = 3;
redTeam.Spawns.RespawnTime.Value = 10;

var zonView = AreaViewService.GetContext().Get("zonView");
zonView.Color = { g: 1, r: 1, b: 1 };
zonView.Tags = ["zon"];
zonView.Enable = true;

var endTrigger = AreaPlayerTriggerService.Get("EndTrigger");
endTrigger.Tags = ["EndAreaTag"];
endTrigger.Enable = true;
endTrigger.OnEnter.Add(function (p) {
if(p.Team !== Teams.Get("Red")){
endTrigger.Enable = false;
p.Properties.Get(LeaderBoardProp).Value += 6666;
p.Properties.Scores.Value += 6000;
SetEndOfMatchMode();
}else{
p.Ui.Hint.Value = "застройте данную точку,не дайте зекам попасть сюда.";
}
});

Players.OnPlayerDisconnected.Add(function(p) { 
if (p.inventory.Main.Value){
p.inventory.Main.Value = false;
blueTeam.Properties.Get("main").Value += 1;
}
});
var zon = AreaPlayerTriggerService.Get("zon");
zon.Tags = ["zon"];
zon.Enable = true;
zon.OnEnter.Add(function(p, area) {
  switch (area.Name) {
    case "Build":
      if(GameMode.Parameters.GetBool("Build")){
      if (p.Team !== redTeam && p.inventory.Build.Value == false){
      p.inventory.Build.Value = true;
	  p.Ui.Hint.Value = "ты взял строительные средства";
	  }else{p.Ui.Hint.Value = "у вас уже есть этот предмет"}
	  }else{p.Ui.Hint.Value = "увы но здесь нечего нет..."}
      break;
    case "Secondary ":
      if(GameMode.Parameters.GetBool("Secondary")){
      if (p.Team !== redTeam && p.inventory.Secondary.Value == false){
      p.inventory.Secondary.Value = true;
      p.Ui.Hint.Value = "ты взял пестолет";
      }else{p.Ui.Hint.Value = "у вас уже есть это оружие"}
      }else{p.Ui.Hint.Value = "увы но здесь нечего нет..."}
      break;
    case "Melee":
      if(GameMode.Parameters.GetBool("Melee")){
      if (p.Team !== redTeam && p.inventory.Melee.Value == false){
      p.inventory.Melee.Value = true;
      p.Ui.Hint.Value = "ты взял нож";
      }else{p.Ui.Hint.Value = "у вас уже есть это оружие"}
      }else{p.Ui.Hint.Value = "увы но здесь нечего нет..."}
      break;
    case "Main":
      if(GameMode.Parameters.GetBool("Main")){
      if (blueTeam.Properties.Get("main").Value >= 3){
      p.Ui.Hint.Value = "тут уже нету оружия";
      }else{
      if (p.Team !== redTeam && p.inventory.Main.Value == false){
      blueTeam.Properties.Get("main").Value += 1;
      p.inventory.Main.Value = true;
      p.Ui.Hint.Value = "ты взял основное оружие";
      }else{p.Ui.Hint.Value = "у вас уже есть это оружие"}
      }
      }else{p.Ui.Hint.Value = "увы но здесь нечего нет..."}
      break;
  }
});
zon.OnExit.Add(function(p) {
p.Ui.Hint.Reset();
});

Timers.OnPlayerTimer.Add(function(timer) {
  var p = timer.Player;
  var prop = p.Properties; 
  var pId = timer.id; 
//таймеры
   if (pId === "tim1") { 
   if (p.inventory.Melee.Value || p.inventory.Secondary.Value || p.inventory.Build.Value || p.Inventory.Main.Value) {
   p.Timers.Get("tim1").Stop();
   p.Timers.Get("tim2").Stop();
   }
   }
	if (pId === "tim2") { 
	p.inventory.Melee.Value = true;
	p.Ui.Hint.Value = "вы нашли нож ";
	}
});
// создаем лидерборд
LeaderBoard.PlayerLeaderBoardValues = [
	{
		Value: "Deaths",
		DisplayName: "Statistics/Deaths",
		ShortDisplayName: "Statistics/DeathsShort"
	},
	{
		Value: LeaderBoardProp,
		DisplayName: "Statistics/Scores",
		ShortDisplayName: "Statistics/ScoresShort"
	}
];
// сортировка команд
LeaderBoard.TeamLeaderBoardValue = {
	Value: LeaderBoardProp,
	DisplayName: "Statistics\Scores",
	ShortDisplayName: "Statistics\Scores"
};

// сортировка игроков
LeaderBoard.PlayersWeightGetter.Set(function (player) {
	return player.Properties.Get(LeaderBoardProp).Value;
});
// счетчик смертей
Damage.OnDeath.Add(function (player) {
	++player.Properties.Deaths.Value;
});

// разрешаем вход в команду
Teams.OnRequestJoinTeam.Add(function (player, team) { team.Add(player); });
// разрешаем спавн
Teams.OnPlayerChangeTeam.Add(function (player) { player.Spawns.Spawn() });


// счетчик спавнов
Spawns.OnSpawn.Add(function (p) {
	++p.Properties.Spawns.Value;
	p.Timers.Get("tim1").RestartLoop(1);
	p.Timers.Get("tim2").Restart(50);
});

Damage.OnKill.Add(function(p, k) {
	if (k.Team != null && k.Team != p.Team) {
		++p.Properties.Kills.Value;
		p.Properties.Scores.Value += 100;
	}
	if (k.inventory.Melee.Value || k.inventory.Secondary.Value || k.inventory.Build.Value || k.Inventory.Main.Value){
	if (k.Team == Teams.Get("Blue")){
	k.inventory.Melee.Value = false;
	k.inventory.Secondary.Value = false;
	k.inventory.Build.Value = false;
	k.Ui.Hint.Value = "вас поймали и обыскали";
	if (k.Inventory.Main.Value){
	k.Inventory.Main.Value = false;
	k.Ui.Hint.Value = "вас поймали и обыскали";
	blueTeam.Properties.Get("main").Value -= 1;
	}
	}
	}
});
// делаем игроков неуязвимыми после спавна
var immortalityTimerName="immortality";
Spawns.GetContext().OnSpawn.Add(function(player){
	player.Properties.Immortality.Value=true;
	timer=player.Timers.Get(immortalityTimerName).Restart(10);
});
Timers.OnPlayerTimer.Add(function(timer){
	if(timer.Id!=immortalityTimerName) return;
	timer.Player.Properties.Immortality.Value=false;
});



// ��������� ������������ �������
mainTimer.OnTimer.Add(function() {
	switch (stateProp.Value) {
	case WaitingStateValue:
		SetBuildMode();
		break;
	case BuildModeStateValue:
		SetGameMode();
		break;
	case GameStateValue:
		SetEndOfMatchMode();
		break;
	case EndOfMatchStateValue:
		RestartGame();
		break;
	}
});




// задаем первое игровое состояние
SetWaitingMode();

// состояния игры
function SetWaitingMode() {
	stateProp.Value = WaitingStateValue;
	Ui.GetContext().Hint.Value = "ожидание игроков";
	Spawns.GetContext().enable = false;
	mainTimer.Restart(WaitingPlayersTime);
}
function SetBuildMode() 
{
	stateProp.Value = BuildModeStateValue;
	Ui.GetContext(redTeam).Hint.Value = "Застраивайте камеры зеков!";
	blueTeam.Ui.Hint.Value = "красные застраивают камеры,мешайте им";
	
	zon.Enable = false;
	
	mainTimer.Restart(BuildBaseTime);
	Spawns.GetContext().enable = true;
	SpawnTeams();
}

function SetGameMode() 
{
	stateProp.Value = GameStateValue;
	
    redTeam.Ui.Hint.Value = "ТВОЯ ЗАДАЧА НЕ ДАТЬ ЗЕКАМ ЗБЕЖАТЬ";
    blueTeam.Ui.Hint.Value = "ТВОЯ ЗАДАЧА ЗБЕЖАТЬ";
    
    zon.Enable = true;
    
	blueTeam.Inventory.Main.Value = false;
	blueTeam.Inventory.Secondary.Value = false;
	blueTeam.Inventory.SecondaryInfinity.Value = false;
	blueTeam.Inventory.Melee.Value = false;
	blueTeam.Inventory.Explosive.Value = false;
	blueTeam.Inventory.Build.Value = false;

	redTeam.Inventory.Main.Value = true;
	redTeam.Inventory.Secondary.Value = true;
	redTeam.Inventory.Melee.Value = true;
	redTeam.Inventory.Explosive.Value = false;
	redTeam.Inventory.Build.Value = true;
	
	mainTimer.Restart(GameModeTime);
	Spawns.GetContext().Despawn();
	SpawnTeams();
}
function SetEndOfMatchMode()
{
	stateProp.Value = EndOfMatchStateValue;
	Ui.GetContext().Hint.Value = "Hint/EndOfMatch";

	var spawns = Spawns.GetContext();
	spawns.enable = false;
	spawns.Despawn();
	Game.GameOver(LeaderBoard.GetTeams());
	mainTimer.Restart(EndOfMatchTime);
}
function RestartGame() {
	Game.RestartGame();
}

function SpawnTeams() {
	var e = Teams.GetEnumerator();
	while (e.moveNext()) {
		Spawns.GetContext(e.Current).Spawn();
	}
}