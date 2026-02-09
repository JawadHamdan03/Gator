import {
  CommandsRegistry,
  handlerAddFeed,
  handlerAgg,
  handlerFeeds,
  handlerFollow,
  handlerFollowing,
  handlerBrowse,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUnfollow,
  handlerUsers,
  middlewareLoggedIn,
  registerCommand,
  runCommand,
} from "./commands.js";

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));

  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.error("Not enough arguments provided");
    process.exit(1);
  }

  const cmdName = argv[0];
  const args = argv.slice(1);

  try {
    await runCommand(registry, cmdName, ...args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    process.exit(1);
  }

  process.exit(0);
}

main();

