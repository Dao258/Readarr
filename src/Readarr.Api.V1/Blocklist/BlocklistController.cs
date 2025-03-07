using Microsoft.AspNetCore.Mvc;
using NzbDrone.Core.Blocklisting;
using NzbDrone.Core.Datastore;
using NzbDrone.Http.REST.Attributes;
using Readarr.Http;
using Readarr.Http.Extensions;

namespace Readarr.Api.V1.Blocklist
{
    [V1ApiController]
    public class BlocklistController : Controller
    {
        private readonly IBlocklistService _blocklistService;

        public BlocklistController(IBlocklistService blocklistService)
        {
            _blocklistService = blocklistService;
        }

        [HttpGet]
        public PagingResource<BlocklistResource> GetBlocklist()
        {
            var pagingResource = Request.ReadPagingResourceFromRequest<BlocklistResource>();
            var pagingSpec = pagingResource.MapToPagingSpec<BlocklistResource, NzbDrone.Core.Blocklisting.Blocklist>("date", SortDirection.Descending);

            return pagingSpec.ApplyToPage(_blocklistService.Paged, BlocklistResourceMapper.MapToResource);
        }

        [RestDeleteById]
        public void DeleteBlocklist(int id)
        {
            _blocklistService.Delete(id);
        }

        [HttpDelete("bulk")]
        public object Remove([FromBody] BlocklistBulkResource resource)
        {
            _blocklistService.Delete(resource.Ids);

            return new object();
        }
    }
}
