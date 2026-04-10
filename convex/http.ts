import { httpRouter } from "convex/server";
import { auth } from "./auth";
import {
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  semanticSearchItems,
} from "./httpActions/items";
import {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from "./httpActions/topics";

const http = httpRouter();

// Convex Auth routes (handles /api/auth/*)
auth.addHttpRoutes(http);

// Items
http.route({ path: "/api/items", method: "POST", handler: createItem });
http.route({ path: "/api/items", method: "GET", handler: listItems });
http.route({ path: "/api/items/search", method: "GET", handler: semanticSearchItems });
http.route({ pathPrefix: "/api/items/", method: "GET", handler: getItem });
http.route({ pathPrefix: "/api/items/", method: "PATCH", handler: updateItem });
http.route({ pathPrefix: "/api/items/", method: "DELETE", handler: deleteItem });

// Topics
http.route({ path: "/api/topics", method: "GET", handler: listTopics });
http.route({ path: "/api/topics", method: "POST", handler: createTopic });
http.route({ pathPrefix: "/api/topics/", method: "PATCH", handler: updateTopic });
http.route({ pathPrefix: "/api/topics/", method: "DELETE", handler: deleteTopic });

export default http;
